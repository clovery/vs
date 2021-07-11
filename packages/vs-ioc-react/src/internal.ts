import { ServiceIdentifier, ServiceCollection } from "vs-ioc";
import { ServiceContext } from "./provider";
import { ComponentClass, Component } from "react";

// https://reactjs.org/docs/context.html#classcontexttype
const contextTypeKey = "contextType";

// Object.defineProperty is used to associate data with objects (component classes and instances)
// #DX: ES6 WeakMap could be used instead in the future when polyfill won't be required anymore
const AdministrationKey = "~$vs-ioc-react";

// internal data associated with component class
type DiClassAdministration = {
  accepts: boolean;
};

// internal data associated with component instance
type DiInstanceAdministration = {
  container: ServiceCollection;

  properties: { [key: string]: () => unknown };
};

function getClassAdministration(target: any) {
  let administration: DiClassAdministration | undefined =
    target[AdministrationKey];

  if (!administration) {
    administration = {
      accepts: false,
    };

    Object.defineProperty(target, AdministrationKey, {
      enumerable: false,
      writable: false,
      value: administration,
    });
  }

  return administration;
}

function getInstanceAdministration(target: any): DiInstanceAdministration {
  let administration: DiInstanceAdministration | undefined =
    target[AdministrationKey];

  if (!administration) {
    const container = target.context;
    if (!container) {
      throw new Error(
        "Cannot use resolve services without any providers in component tree."
      );
    }

    administration = {
      container,
      properties: {},
    };

    Object.defineProperty(target, AdministrationKey, {
      enumerable: false,
      writable: false,
      value: administration,
    });
  }

  return administration;
}

function ensureAcceptContext(target: ComponentClass) {
  const administration = getClassAdministration(target);

  if (!administration.accepts) {
    const { contextType } = target;
    const componentName = target.displayName || target.name;
    if (contextType) {
      throw new Error(
        "vs-ioc-react cannot configure React context.\n" +
          `Component \`${componentName}\` already has \`${contextTypeKey}: ${
            contextType.displayName || "<anonymous context>"
          }\` defined.\n` +
          "@see vs-ioc-react/test/resolve.tsx#limitations for more info and workarounds\n"
      );
    }

    Object.defineProperty(target, contextTypeKey, {
      enumerable: true,
      get() {
        return ServiceContext;
      },
      set(value: unknown) {
        if (value !== ServiceContext) {
          // warn users if they also try to use `contextType` of this component
          throw new Error(
            `Cannot change \`${contextTypeKey}\` of \`${componentName}\` component.\n` +
              "Looks like you are using vs-ioc-react decorators, " +
              "which have already patched this component and use own context to deliver IoC container.\n" +
              "@see vs-ioc-react/test/resolve.tsx#limitations for more info and workarounds\n"
          );
        }
      },
    });

    administration.accepts = true;
  }
}

type PropertyOptions = Readonly<{
  isOptional?: boolean;
  defaultValue?: unknown;
}>;

function createProperty(
  target: Component,
  name: string,
  type: ServiceIdentifier<unknown>,
  options: PropertyOptions
) {
  Object.defineProperty(target, name, {
    enumerable: true,
    get() {
      const administration = getInstanceAdministration(this);
      let getter = administration.properties[name];

      if (!getter) {
        const { container } = administration;
        const { instantiationService } = container as any;

        let value: unknown;
        if (options.isOptional) {
          if (true /*container.isBound(type)*/) {
            value = container.get(type);
          } else {
            value = options.defaultValue;
          }
        } else {
          value = instantiationService.get(type);
        }

        getter = administration.properties[name] = () => value;
      }

      return getter();
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(target, name);
  if (!descriptor) throw new Error("Failed to define property");

  return descriptor;
}

export type {
  AdministrationKey,
  DiClassAdministration,
  DiInstanceAdministration,
  PropertyOptions,
};

export {
  ensureAcceptContext,
  createProperty,
  getClassAdministration,
  getInstanceAdministration,
};
