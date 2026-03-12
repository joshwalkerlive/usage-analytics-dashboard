// Type declarations for the File System Access API
// https://wicg.github.io/file-system-access/

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file";
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle
  extends FileSystemHandle,
    AsyncIterable<[string, FileSystemHandle]> {
  readonly kind: "directory";
}

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}
