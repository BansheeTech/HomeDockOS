<!-- homedock-ui/vue3/static/js/__Apps__/UtilsCalculator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="calculator flex flex-col h-full overflow-hidden select-none" @keydown="handleKeydown" tabindex="0" ref="calculatorRef">
    <div class="display flex-shrink-0 p-4 flex flex-col justify-end min-h-[120px]" :class="themeClasses.windowBg">
      <div class="expression text-right text-sm mb-1 min-h-[20px] truncate" :class="themeClasses.windowTextMuted">
        {{ expression || "&nbsp;" }}
      </div>
      <div class="value text-right font-light truncate" :class="[themeClasses.windowText, displayFontSize]">
        {{ displayValue }}
      </div>
    </div>

    <div class="buttons flex-1 grid grid-cols-4 gap-[1px] p-[1px]" :class="themeClasses.calculatorGrid">
      <button @click="clear" :class="[themeClasses.calculatorBtnFunction]" class="calc-btn">
        {{ currentValue === "0" && !expression ? "AC" : "C" }}
      </button>
      <button @click="toggleSign" :class="[themeClasses.calculatorBtnFunction]" class="calc-btn">±</button>
      <button @click="percentage" :class="[themeClasses.calculatorBtnFunction]" class="calc-btn">%</button>
      <button @click="setOperator('/')" :class="[themeClasses.calculatorBtnOperator, operator === '/' ? themeClasses.calculatorBtnOperatorActive : '']" class="calc-btn">÷</button>

      <button @click="appendNumber('7')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">7</button>
      <button @click="appendNumber('8')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">8</button>
      <button @click="appendNumber('9')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">9</button>
      <button @click="setOperator('*')" :class="[themeClasses.calculatorBtnOperator, operator === '*' ? themeClasses.calculatorBtnOperatorActive : '']" class="calc-btn">×</button>

      <button @click="appendNumber('4')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">4</button>
      <button @click="appendNumber('5')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">5</button>
      <button @click="appendNumber('6')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">6</button>
      <button @click="setOperator('-')" :class="[themeClasses.calculatorBtnOperator, operator === '-' ? themeClasses.calculatorBtnOperatorActive : '']" class="calc-btn">−</button>

      <button @click="appendNumber('1')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">1</button>
      <button @click="appendNumber('2')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">2</button>
      <button @click="appendNumber('3')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">3</button>
      <button @click="setOperator('+')" :class="[themeClasses.calculatorBtnOperator, operator === '+' ? themeClasses.calculatorBtnOperatorActive : '']" class="calc-btn">+</button>

      <button @click="appendNumber('0')" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn col-span-2">0</button>
      <button @click="appendDecimal" :class="[themeClasses.calculatorBtnNumber]" class="calc-btn">.</button>
      <button @click="calculate" :class="[themeClasses.calculatorBtnEquals]" class="calc-btn">=</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

const { themeClasses } = useTheme();

const calculatorRef = ref<HTMLElement | null>(null);

const currentValue = ref("0");
const previousValue = ref<string | null>(null);
const operator = ref<string | null>(null);
const expression = ref("");
const waitingForOperand = ref(false);
const lastResult = ref<string | null>(null);

const displayValue = computed(() => {
  const value = currentValue.value;

  if (value === "Error" || value === "Infinity" || value === "-Infinity") {
    return value === "Infinity" || value === "-Infinity" ? "Error" : value;
  }

  const parts = value.split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
});

const displayFontSize = computed(() => {
  const len = currentValue.value.replace(/[-.]/g, "").length;
  if (len <= 6) return "text-5xl";
  if (len <= 9) return "text-4xl";
  if (len <= 12) return "text-3xl";
  return "text-2xl";
});

function appendNumber(num: string) {
  if (waitingForOperand.value) {
    currentValue.value = num;
    waitingForOperand.value = false;
  } else {
    if (currentValue.value.replace(/[-.]/g, "").length >= 15) return;

    currentValue.value = currentValue.value === "0" ? num : currentValue.value + num;
  }
}

function appendDecimal() {
  if (waitingForOperand.value) {
    currentValue.value = "0.";
    waitingForOperand.value = false;
    return;
  }

  if (!currentValue.value.includes(".")) {
    currentValue.value += ".";
  }
}

function setOperator(op: string) {
  if (currentValue.value === "Error") return;

  if (previousValue.value === null) {
    previousValue.value = currentValue.value;
  } else if (operator.value && !waitingForOperand.value) {
    const result = performCalculation();

    if (!isResultSafe(result)) {
      currentValue.value = "Error";
      previousValue.value = null;
      operator.value = null;
      expression.value = "";
      waitingForOperand.value = true;
      return;
    }

    currentValue.value = String(result);
    previousValue.value = String(result);
  }

  const opSymbol = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : "+";
  expression.value = `${formatForExpression(previousValue.value!)} ${opSymbol}`;

  operator.value = op;
  waitingForOperand.value = true;
}

function formatForExpression(value: string): string {
  const num = parseFloat(value);
  if (Number.isInteger(num) && Math.abs(num) < 1e15) {
    return num.toLocaleString("en-US");
  }
  return parseFloat(num.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 10 });
}

function safeFloat(value: number, precision: number = 12): number {
  if (!isFinite(value)) return value;
  return Number(value.toPrecision(precision));
}

function isResultSafe(value: number): boolean {
  if (isNaN(value) || !isFinite(value)) return false;
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) return false;
  return true;
}

function performCalculation(): number {
  const prev = parseFloat(previousValue.value || "0");
  const curr = parseFloat(currentValue.value);

  if (isNaN(prev) || isNaN(curr)) return NaN;

  let result: number;

  switch (operator.value) {
    case "+":
      result = prev + curr;
      break;
    case "-":
      result = prev - curr;
      break;
    case "*":
      result = prev * curr;
      break;
    case "/":
      if (curr === 0) return NaN;
      result = prev / curr;
      break;
    default:
      return curr;
  }

  return safeFloat(result);
}

function calculate() {
  if (operator.value === null || previousValue.value === null) {
    return;
  }

  const result = performCalculation();

  const opSymbol = operator.value === "*" ? "×" : operator.value === "/" ? "÷" : operator.value === "-" ? "−" : "+";
  expression.value = `${formatForExpression(previousValue.value)} ${opSymbol} ${formatForExpression(currentValue.value)} =`;

  if (!isResultSafe(result)) {
    currentValue.value = "Error";
    previousValue.value = null;
    operator.value = null;
    waitingForOperand.value = true;
    return;
  }

  let resultStr: string;

  if (Number.isInteger(result) && Math.abs(result) < 1e15) {
    resultStr = result.toString();
  } else {
    resultStr = safeFloat(result, 10).toString();

    if (resultStr.replace(/[-.]/g, "").length > 15) {
      resultStr = result.toExponential(6);
    }
  }

  currentValue.value = resultStr;
  lastResult.value = resultStr;
  previousValue.value = null;
  operator.value = null;
  waitingForOperand.value = true;
}

function clear() {
  if (currentValue.value === "0" && !expression.value) {
    previousValue.value = null;
    operator.value = null;
    expression.value = "";
    lastResult.value = null;
  } else {
    currentValue.value = "0";
    if (!operator.value) {
      expression.value = "";
    }
  }
  waitingForOperand.value = false;
}

function toggleSign() {
  if (currentValue.value === "0" || currentValue.value === "Error") return;

  if (currentValue.value.startsWith("-")) {
    currentValue.value = currentValue.value.slice(1);
  } else {
    currentValue.value = "-" + currentValue.value;
  }
}

function percentage() {
  const value = parseFloat(currentValue.value);
  if (isNaN(value)) return;

  let result: number;
  if (previousValue.value !== null && operator.value) {
    const prev = parseFloat(previousValue.value);
    result = safeFloat((prev * value) / 100);
  } else {
    result = safeFloat(value / 100);
  }

  if (!isResultSafe(result)) {
    currentValue.value = "Error";
    return;
  }

  currentValue.value = String(result);
}

function backspace() {
  if (waitingForOperand.value || currentValue.value === "Error") {
    return;
  }

  if (currentValue.value.length === 1 || (currentValue.value.length === 2 && currentValue.value.startsWith("-"))) {
    currentValue.value = "0";
  } else {
    currentValue.value = currentValue.value.slice(0, -1);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (/^[0-9.+\-*/=%]$/.test(e.key) || e.key === "Enter" || e.key === "Backspace" || e.key === "Escape") {
    e.preventDefault();
  }

  if (/^[0-9]$/.test(e.key)) {
    appendNumber(e.key);
  } else if (e.key === "." || e.key === ",") {
    appendDecimal();
  } else if (e.key === "+") {
    setOperator("+");
  } else if (e.key === "-") {
    setOperator("-");
  } else if (e.key === "*" || e.key === "x" || e.key === "X") {
    setOperator("*");
  } else if (e.key === "/") {
    setOperator("/");
  } else if (e.key === "=" || e.key === "Enter") {
    calculate();
  } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
    clear();
  } else if (e.key === "Backspace") {
    backspace();
  } else if (e.key === "%") {
    percentage();
  }
}

onMounted(() => {
  calculatorRef.value?.focus();
});
</script>

<style scoped>
.calculator:focus {
  outline: none;
}

.calc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 400;
  transition: all 0.1s ease;
  user-select: none;
  -webkit-user-select: none;
}

.calc-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.col-span-2 {
  grid-column: span 2;
}
</style>
