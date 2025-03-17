import { Modal, Spinner } from "./components";

export function LoadingScreen() {
  return (
    <Modal className="flex flex-col items-center gap-5 px-10 py-6">
      <div className="text-2xl">Loading...</div>
      <Spinner />
    </Modal>
  );
}
