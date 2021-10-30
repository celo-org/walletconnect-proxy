import Item from "antd/lib/list/Item"
import { useState } from "react"

export default function useTopicArray<T extends { topic: string }>(): [Array<T>, (item: T) => void, (item: T) => void, (topic: string, partialItem: Partial<T>) => void] {
  const [data, setData] = useState<Array<T>>([])
  const addItem = (item: T) => setData(data => [...data, item])
  const removeItem = (item: T) => setData(data => {
    const index = data.findIndex(_ => _.topic === item.topic)
    data.splice(index, 1)
    return data
  })
  const updateItem = (topic: string, partialItem: Partial<T>) => setData(data => {
    const index = data.findIndex(_ => _.topic === topic)
    const item = data[index]
    data.splice(index, 1)
    return [...data, { ...item, ...partialItem }]
  })
  
  return [
    data,
    addItem,
    removeItem,
    updateItem
  ]
}