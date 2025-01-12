"""
hd_CSPMaxed.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

from flask import g, request
from pymodules.hd_HyperSpoof import HeaderManager

header_manager = HeaderManager()


def generate_csp(nonce, is_development, endpoint=""):
    # fmt: off
    csp = (
        "default-src 'self' ;"
        "frame-ancestors 'self' ; "
        "script-src 'self' 'nonce-{{nonceMarker}}' ;"
        "style-src 'self' 'unsafe-inline' ;"
        "form-action 'self' ;"
        "media-src 'self' ;"
        "img-src 'self' cdn.homedock.cloud ;"
        "base-uri 'self' ;"
        "object-src 'none' ;"
        "font-src 'self' ;"
        "connect-src 'self' ;"
    )
    # fmt: on

    if is_development:
        csp = csp.replace("script-src 'self' 'nonce-{{nonceMarker}}'", "script-src 'self' http://localhost:5173 'unsafe-eval' ")
        csp = csp.replace("style-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' http://localhost:5173 ")
        # Uncomment this line to use nonces for style-src, gotta find CSP workaround for AntDVue inline styles
        # csp = csp.replace("style-src 'self' 'nonce-{{nonceMarker}}'", "style-src 'self' http://localhost:5173 ")
        csp = csp.replace("connect-src 'self'", "connect-src 'self' ws://localhost:5173 http://localhost:5173 ")

    csp = csp_endpoint_evaluator(csp, endpoint)
    csp = csp.replace("{{nonceMarker}}", nonce)

    return csp


def csp_endpoint_evaluator(csp, endpoint):
    if endpoint == "#CSP_EVAL_SYSLOGS":
        csp = csp.replace("connect-src 'self'", "connect-src 'self' https://ip.guide ")
    return csp


def set_common_headers(response, selected_server, is_development):
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Download-Options"] = "noopen"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    response.headers["Server"] = header_manager.server
    response.headers["Via"] = header_manager.via
    response.headers["X-Powered-By"] = header_manager.powered_by
    response.headers["X-Custom-CDN-Node"] = header_manager.cdn_node
    response.headers["X-Custom-Primary-IP"] = header_manager.primary_ip
    response.headers["X-Custom-Secondary-IP"] = header_manager.secondary_ip

    response.headers["X-Cloud-Os-Name"] = "HomeDock OS"
    response.headers["X-Cloud-Os-Website"] = "https://www.homedock.cloud"
    response.headers["Server"] = selected_server
    
    if is_development:
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

    return response


def setup_security_headers(app, config):
    def set_security_headers(response):
        nonce = g.get("nonce", "")
        endpoint = request.endpoint
        is_development = config["run_on_development"]

        header_manager.handle_request_counter()

        csp = generate_csp(nonce, is_development, endpoint)
        response.headers["Content-Security-Policy"] = csp

        set_common_headers(response, header_manager.server, is_development)

        return response

    app.after_request(set_security_headers)
