export type Stats = {
  maxStorage: number;
  maxStorageFormatted: string;
  usedStorageFormatted: string;
  usedStorage: number;
  usedStorageInPercent: number;
  dashoffset: number;
}

export type Item = {
  name: string;
  fullName: string;
  bytes?: number;
  usageRatio?: number;
  usedStorage?: string;
}
