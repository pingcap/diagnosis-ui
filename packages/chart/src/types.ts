export type DataPoint = [msTimestamp: number, value: number | null]

export enum TransformNullValue {
  NULL = 'null',
  AS_ZERO = 'as_zero',
}
