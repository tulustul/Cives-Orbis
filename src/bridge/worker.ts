import { Observable, share } from "rxjs";
import CoreWorker from "@/core.worker?worker";

export const worker = new CoreWorker();

export const awaitingExecutors: ((value: any) => void)[] = [];

export const bridgeHandlers = new Map<string, (data: any) => void>();

export function makeObservable<T>(type: string): Observable<T> {
  return new Observable<T>((subscriber) => {
    bridgeHandlers.set(type, (data) => subscriber.next(data));
  }).pipe(share<T>());
}

export function makeCommand<T>(command: string, data: any = {}) {
  return new Promise<T>((resolve) => {
    awaitingExecutors.push(resolve);
    worker.postMessage({ command, data });
  });
}

export function initWorkerListeners() {
  worker.addEventListener("error", onError, false);
  worker.addEventListener("message", onMessage, false);
  worker.addEventListener("messageerror", onMessageError, false);
}

function onMessage(event: MessageEvent) {
  const executor = awaitingExecutors.shift();
  if (!executor) {
    console.error("No awaiting executors but message received.");
    return;
  }

  for (const change of event.data.changes) {
    console.debug(`change received: ${change.type}`);
    const bridgeHandler = bridgeHandlers.get(change.type);
    if (!bridgeHandler) {
      console.error(`No handler for change with type "${change.type}"`);
      continue;
    }

    if (bridgeHandler) {
      bridgeHandler(change.data);
    }
  }

  executor(event.data.result);

  const nextTaskHandler = bridgeHandlers.get("nextTask")!;
  nextTaskHandler(event.data.nextTask);
}

function onError(error: any) {
  console.error(`Webworker error: ${error.message}`);
}

function onMessageError(error: any) {
  console.error(`Webworker message error: ${error.message}`);
}
