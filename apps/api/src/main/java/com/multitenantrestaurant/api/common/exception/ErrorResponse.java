package com.multitenantrestaurant.api.common.exception;

public record ErrorResponse(String code, String message, Object details) {}
