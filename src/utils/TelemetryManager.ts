import * as vscode from 'vscode';

/**
 * Keep the existing instrumentation call sites API-compatible without sending
 * usage data to a third party. Diagnostics stay in the local VS Code log.
 */
export function initTelemetry(): vscode.Disposable {
  return new vscode.Disposable(() => undefined);
}

/**
 * Send a named telemetry event with optional string properties and
 * numeric measurements.
 */
export function sendEvent(
  eventName: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>,
): void {
  void eventName;
  void properties;
  void measurements;
}

/**
 * Send an error event (non-exception).  Properties describe the error
 * context; the data is still sent through the normal event pipeline.
 */
export function sendError(
  eventName: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>,
): void {
  void eventName;
  void properties;
  void measurements;
}

/**
 * Report an exception / caught error as an error event.
 */
export function sendException(error: Error, properties?: Record<string, string>): void {
  void error;
  void properties;
}
