export interface Product {
  id: string
  name: string
  description: string
  address: string
  longitude: number
  latitude: number
  basePrice: string
  type?: {
    id: string
    name: string
  }
  img?: Array<{
    id: string
    img: string
  }>
}
