// @ts-nocheck
import { canWrite, isDefined, panic, Procedure, safeWrite } from './std'
import { Html } from './html'
import { SupportedSvgTags } from './supported-svg-tags'
import { Inject } from './inject'
import { DomElement, JsxValue } from './types'

type Factory = (attributes: Readonly<Record<string, any>>, children?: ReadonlyArray<JsxValue>) => JsxValue
type TagOrFactoryOrElement = string | Factory | DomElement

const EmptyAttributes = Object.freeze({})
const EmptyChildren: ReadonlyArray<JsxValue> = Object.freeze([])

function isInjectValue(x: any): x is InstanceType<typeof Inject.Value> {
    return x && typeof x === 'object' && typeof x.addTarget === 'function' && 'value' in x
}
function isInjectAttribute(x: any): x is InstanceType<typeof Inject.Attribute> {
    return x && typeof x === 'object' && typeof x.addTarget === 'function'
}
function isInjectRef(x: any): x is InstanceType<typeof Inject.Ref> {
    return x && typeof x === 'object' && typeof x.addTarget === 'function'
}
function isInjectClassList(x: any): x is InstanceType<typeof Inject.ClassList> {
    return x && typeof x === 'object' && typeof x.addTarget === 'function'
}

export function createElement(tagOrFactoryOrElement: TagOrFactoryOrElement,
                              attributes: Readonly<Record<string, any>> | null,
                              ...children: ReadonlyArray<JsxValue>): JsxValue {
    if (tagOrFactoryOrElement instanceof HTMLElement || tagOrFactoryOrElement instanceof SVGElement) {
        return tagOrFactoryOrElement
    }
    let element: any
    if (typeof tagOrFactoryOrElement === "function") {
        element = tagOrFactoryOrElement(attributes ?? EmptyAttributes, children)
        if ((tagOrFactoryOrElement as Function).length === 2) {
            children = EmptyChildren
        }
        if (element === false
            || element === true
            || element === null
            || element === undefined
            || typeof element === "string"
            || typeof element === "number"
            || Array.isArray(element)) {
            return element
        }
        attributes = null
    } else {
        element = SupportedSvgTags.has(tagOrFactoryOrElement)
            ? document.createElementNS("http://www.w3.org/2000/svg", tagOrFactoryOrElement)
            : document.createElement(tagOrFactoryOrElement)
    }
    if (children.length > 0) {
        appendChildren(element, ...children)
    }
    if (attributes !== null) {
        transferAttributes(element, attributes)
    }
    return element
}

export const replaceChildren = (element: DomElement, ...children: ReadonlyArray<JsxValue>) => {
    Html.empty(element)
    appendChildren(element, ...children)
}

export const appendChildren = (element: DomElement, ...children: ReadonlyArray<JsxValue>) => {
    children.forEach((value: JsxValue | any) => {
        if (value === null || value === undefined || value === false) {return}
        if (Array.isArray(value)) {
            appendChildren(element, ...value)
        } else if (isInjectValue(value)) {
            const text: Text = document.createTextNode(String(value.value))
            value.addTarget && value.addTarget(text)
            element.append(text)
        } else if (typeof value === "string") {
            element.append(document.createTextNode(value))
        } else if (typeof value === "number") {
            element.append(document.createTextNode(String(value)))
        } else if (value instanceof Node) {
            element.append(value)
        }
    })
}

const transferAttributes = (element: DomElement, attributes: Readonly<Record<string, any>>) => {
    Object.entries(attributes).forEach(([key, value]: [string, unknown]) => {
        if (value === undefined) {return}
        if (key === "class" || key === "className") {
            if (isInjectClassList(value)) {
                value.addTarget && value.addTarget(element)
            } else {
                (element as Element).classList.add(...(<string>value).split(" "))
            }
        } else if (key === "style") {
            if (typeof value === "string") {
                element.setAttribute(key, value as string)
            } else if (isDefined(value)) {
                Object.entries(value as Record<string, any>).forEach(([key2, v]) => {
                    if (key2.startsWith("--")) {
                        (element as HTMLElement).style.setProperty(key2, String(v))
                    } else {
                        safeWrite((element as any).style, key2, v)
                    }
                })
            }
        } else if (key === "ref") {
            if (isInjectRef(value)) {
                value.addTarget && value.addTarget(element)
            } else {
                return panic("value of 'ref' must be of type '_Ref'")
            }
        } else if (key === "onInit") {
            if (value instanceof Function && (value as Function).length === 1) {
                (value as Procedure<DomElement>)(element)
            } else {
                return panic("value of 'onLoad' must be a Function with a single argument")
            }
        } else if (key === "onConnect") {
            if (value instanceof Function && (value as Function).length === 1) {
                const check = () => {
                    if (element.isConnected) {
                        (value as Procedure<DomElement>)(element)
                    } else {
                        requestAnimationFrame(check)
                    }
                }
                requestAnimationFrame(check)
            } else {
                return panic("value of 'onLoad' must be a Function with a single argument")
            }
        } else if (isInjectAttribute(value)) {
            value.addTarget && value.addTarget(element, key)
        } else {
            if (canWrite(element, key)) {
                try { (element as any)[key] = value } catch { element.setAttribute(key, String(value)) }
            } else {
                element.setAttribute(key, String(value))
            }
        }
    })
}
