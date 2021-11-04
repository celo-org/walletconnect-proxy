import { useState } from "react"

interface State<T> {
  [key: string]: T
}
export default function useKeyState<T extends { key: string }>(): [State<T>, (item: T) => void, (item: T) => void, (key: string, partialItem: Partial<T>) => void] {
  const [data, setData] = useState<State<T>>({})

  const addItem = (item: T) => setData(data => {
    const newData = { ...data }
    newData[item.key] = item
    return newData
  })
  const removeItem = (item: T) => setData(data => {
    const newData = { ...data }
    delete newData[item.key]
    return newData
  })
  const updateItem = (key: string, partialItem: Partial<T>) => setData(data => {
    const newData = { ...data }
    const oldItem = data[key]
    newData[key] = { ...oldItem, ...partialItem }
    return newData
  })
  
  return [
    data,
    addItem,
    removeItem,
    updateItem
  ]
}