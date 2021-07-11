import { useContext } from 'react'
import { ServiceIdentifier } from 'vs-ioc'
import { ServiceContext } from './provider'

/**
 * use service by id
 */
export function useService<T>(id: ServiceIdentifier<T>): T {
  const { instantiationService } = useContext(ServiceContext)
  return instantiationService.get<T>(id)
}
