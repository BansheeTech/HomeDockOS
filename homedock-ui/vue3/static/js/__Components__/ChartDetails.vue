<!-- homedock-ui/vue3/static/js/__Components__/ChartDetails.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="chart-container">
      <canvas :id="chartId"></canvas>
    </div>
    <div ref="sliderContainer" class="slider-container flex items-center">
      <Slider v-model:value="groupSize" :tooltipOpen="false" :min="1" :max="50" @input="processChartData" class="custom-slider w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

import axios from "axios";

import Slider from "ant-design-vue/es/slider";

import { Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from "chart.js";

const props = defineProps({
  apiEndpoint: {
    type: String,
    required: true,
  },
  csrfToken: {
    type: String,
    required: true,
  },
  streamLines: Number,
  streamData: {
    type: Array,
    default: () => ["solid"],
  },
  streamStyle: {
    type: Array,
    default: () => ["solid"],
  },
  streamBorderWidth: {
    type: Array,
    default: () => [3],
  },
  leftLegend: String,
  streamFill: {
    type: Array,
    default: () => ["solid"],
  },
});

const groupSize = ref(25);
const chartId = `chart_${Math.random().toString(36).slice(2, 11)}`;
const serverData = ref<Array<{ timestamp: number; [key: string]: number }>>([]);

let chartInstance: Chart | null = null;

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const getStreamDataKeys = (): string[] => {
  return props.streamData.slice(0, props.streamLines).filter((key): key is string => typeof key === "string");
};

const createDatasets = (keys: string[]) => {
  const colors = [
    { bg: "rgba(100, 181, 34, 0.2)", border: "rgba(100, 181, 34, 1)" },
    { bg: "rgba(217, 153, 137, 0.2)", border: "rgba(217, 153, 137, 1)" },
    { bg: "rgba(137, 166, 217, 0.2)", border: "rgba(137, 166, 217, 1)" },
  ];

  return keys.map((key, index) => ({
    label: key.replace(/^\w/, (c) => c.toUpperCase()),
    data: [],
    backgroundColor: colors[index % colors.length].bg,
    borderColor: colors[index % colors.length].border,
    borderWidth: props.streamBorderWidth[index] || 3,
    fill: props.streamFill.includes(index + 1),
    tension: 0.4,
    pointHoverBorderWidth: 8,
    borderDash: props.streamStyle[index] === "dashed" ? [5, 5] : [],
  }));
};

const chartOptions: ChartConfiguration = {
  type: "line",
  data: {
    labels: [],
    datasets: createDatasets(getStreamDataKeys()),
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label || ""}: ${context.parsed.y}${props.leftLegend || ""}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => {
            if (typeof value === "number") {
              const result: string = hasMoreThanTwoDecimals(value) ? value.toFixed(2) + (props.leftLegend || "") : value + (props.leftLegend || "");
              return result;
            }
            return value;
          },
        },
      },
    },
  },
};

const fetchDataFromApi = async () => {
  try {
    const response = await axios.get(props.apiEndpoint, {
      headers: {
        "X-HomeDock-CSRF-Token": props.csrfToken,
      },
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      serverData.value = response.data;
      processChartData();
    } else {
      showNoDataMessage("No data available");
    }
  } catch (error) {
    showNoDataMessage("Error fetching data");
  }
};

const processChartData = () => {
  const groupedData = groupData(serverData.value, groupSize.value);
  const labels = groupedData.map((item) => item.timestamp);
  const keys = getStreamDataKeys();

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets.forEach((dataset, index) => {
      dataset.data = groupedData.map((item) => item[keys[index]]);
    });

    chartInstance.update();
  }
};

const groupData = (data: Array<{ timestamp: number; [key: string]: number }>, size: number) => {
  const keys = getStreamDataKeys();
  return data.reduce((acc: Array<{ timestamp: number; [key: string]: number }>, curr, index) => {
    if (index % size === 0) {
      const grouped = { timestamp: curr.timestamp } as { timestamp: number; [key: string]: number };
      keys.forEach((key) => {
        const groupValues = data.slice(index, index + size).map((item) => item[key]);
        grouped[key] = groupValues.length > 0 ? Math.max(...groupValues) : 0;
      });
      acc.push(grouped);
    }
    return acc;
  }, []);
};

const showNoDataMessage = (message: string) => {
  if (chartInstance) {
    chartInstance.data.labels = ["No Data"];
    chartInstance.data.datasets.forEach((dataset) => {
      dataset.data = [0];
    });

    chartInstance.update();
  }
};

function hasMoreThanTwoDecimals(value: number): boolean {
  const decimalPart = value.toString().split(".")[1];
  return decimalPart ? decimalPart.length > 2 : false;
}

let resizeObserver: ResizeObserver | null = null;
let resizeTimeout: number | null = null;
let isFirstResize = true;

onMounted(() => {
  const canvas = document.getElementById(chartId) as HTMLCanvasElement;
  const ctx = canvas?.getContext("2d");

  if (ctx) {
    chartInstance = new Chart(ctx, chartOptions);
    fetchDataFromApi();

    const container = canvas.parentElement;
    if (container) {
      resizeObserver = new ResizeObserver((entries) => {
        if (isFirstResize) {
          isFirstResize = false;
          return;
        }

        if (resizeTimeout !== null) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
          if (chartInstance && canvas.parentElement) {
            canvas.width = 0;
            canvas.height = 0;

            canvas.removeAttribute("style");

            void canvas.parentElement.offsetHeight;

            chartInstance.resize();

            chartInstance.update("none");
          }
        }, 50);
      });
      resizeObserver.observe(container);
    }
  }
});

onUnmounted(() => {
  if (resizeTimeout !== null) {
    clearTimeout(resizeTimeout);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
});

watch(groupSize, processChartData);
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  min-width: 0;
}

.chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}

:deep(.ant-slider-track) {
  background-color: rgba(100, 181, 34) !important;
}

:deep(.ant-slider-rail) {
  background-color: rgb(198, 224, 177) !important;
}

:deep(.ant-slider-handle::after) {
  outline: 4px solid rgba(100, 181, 34) !important;
}
</style>
