type JsonInner = number | string | boolean | Json
export type Json = { [key: string]: JsonInner } | JsonInner[]
