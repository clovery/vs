import React, { useState } from 'react'
import { IInstantiationService } from 'vs-ioc'

/**
 * ServiceContext
 */
export const ServiceContext = React.createContext<{
  instantiationService: IInstantiationService
}>({} as { instantiationService: IInstantiationService })

/**
 * Provider Props
 */
type ProviderProps = Readonly<{
  instantiationService: IInstantiationService
}>

/**
 * ServiceContext.Provider
 */
export const Provider: React.FC<ProviderProps> = ({ children, instantiationService }) => {
  const [container] = useState(instantiationService)

  return <ServiceContext.Provider value={{ instantiationService: container }}>{children}</ServiceContext.Provider>
}

export type { ProviderProps }
