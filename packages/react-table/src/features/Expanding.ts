import { MouseEvent, TouchEvent } from 'react'
import { RowModel } from '..'
import {
  Getter,
  OnChangeFn,
  PropGetterValue,
  ReactTable,
  Row,
  Updater,
} from '../types'
import { functionalUpdate, makeStateUpdater, memo, propGetter } from '../utils'

export type ExpandedStateList = Record<string, boolean>
export type ExpandedState = true | Record<string, boolean>
export type ExpandedTableState = {
  expanded: ExpandedState
}

export type ExpandedRow = {
  toggleExpanded: (expanded?: boolean) => void
  getIsExpanded: () => boolean
  getCanExpand: () => boolean
  getToggleExpandedProps: <TGetter extends Getter<ToggleExpandedProps>>(
    userProps?: TGetter
  ) => undefined | PropGetterValue<ToggleExpandedProps, TGetter>
}

export type ExpandedOptions<
  TData,
  TValue,
  TFilterFns,
  TSortingFns,
  TAggregationFns
> = {
  onExpandedChange?: OnChangeFn<ExpandedState>
  autoResetExpanded?: boolean
  enableExpanded?: boolean
  expandRowsFn?: (
    instance: ReactTable<
      TData,
      TValue,
      TFilterFns,
      TSortingFns,
      TAggregationFns
    >,
    rowModel: RowModel<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  ) => RowModel<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  expandSubRows?: boolean
  defaultCanExpand?: boolean
  getIsRowExpanded?: (
    row: Row<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  ) => boolean
  getRowCanExpand?: (
    row: Row<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  ) => boolean
  paginateExpandedRows?: boolean
}

export type ToggleExpandedProps = {
  title?: string
  onClick?: (event: MouseEvent | TouchEvent) => void
}

export type ExpandedInstance<
  TData,
  TValue,
  TFilterFns,
  TSortingFns,
  TAggregationFns
> = {
  _notifyExpandedReset: () => void
  setExpanded: (updater: Updater<ExpandedState>) => void
  toggleRowExpanded: (rowId: string, expanded?: boolean) => void
  toggleAllRowsExpanded: (expanded?: boolean) => void
  resetExpanded: () => void
  getRowCanExpand: (rowId: string) => boolean
  getIsRowExpanded: (rowId: string) => boolean
  getToggleExpandedProps: <TGetter extends Getter<ToggleExpandedProps>>(
    rowId: string,
    userProps?: TGetter
  ) => undefined | PropGetterValue<ToggleExpandedProps, TGetter>
  getToggleAllRowsExpandedProps: <TGetter extends Getter<ToggleExpandedProps>>(
    userProps?: TGetter
  ) => undefined | PropGetterValue<ToggleExpandedProps, TGetter>
  getIsAllRowsExpanded: () => boolean
  getExpandedDepth: () => number
  getExpandedRowModel: () => RowModel<
    TData,
    TValue,
    TFilterFns,
    TSortingFns,
    TAggregationFns
  >
  getPreExpandedRows: () => Row<
    TData,
    TValue,
    TFilterFns,
    TSortingFns,
    TAggregationFns
  >[]
  getPreExpandedFlatRows: () => Row<
    TData,
    TValue,
    TFilterFns,
    TSortingFns,
    TAggregationFns
  >[]
  getPreExpandedRowsById: () => Record<
    string,
    Row<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  >
  getExpandedRows: () => Row<
    TData,
    TValue,
    TFilterFns,
    TSortingFns,
    TAggregationFns
  >[]
  getExpandedFlatRows: () => Row<
    TData,
    TValue,
    TFilterFns,
    TSortingFns,
    TAggregationFns
  >[]
  getExpandedRowsById: () => Record<
    string,
    Row<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
  >
}

//

export function getInitialState(): ExpandedTableState {
  return {
    expanded: {},
  }
}

export function getDefaultOptions<
  TData,
  TValue,
  TFilterFns,
  TSortingFns,
  TAggregationFns
>(
  instance: ReactTable<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
): ExpandedOptions<TData, TValue, TFilterFns, TSortingFns, TAggregationFns> {
  return {
    onExpandedChange: makeStateUpdater('expanded', instance),
    autoResetExpanded: true,
    getIsRowExpanded: row => !!(row?.original as { expanded?: any }).expanded,
    expandSubRows: true,
    paginateExpandedRows: true,
  }
}

export function getInstance<
  TData,
  TValue,
  TFilterFns,
  TSortingFns,
  TAggregationFns
>(
  instance: ReactTable<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
): ExpandedInstance<TData, TValue, TFilterFns, TSortingFns, TAggregationFns> {
  let registered = false

  return {
    _notifyExpandedReset: () => {
      if (!registered) {
        registered = true
        return
      }

      if (instance.options.autoResetAll === false) {
        return
      }

      if (
        instance.options.autoResetAll === true ||
        instance.options.autoResetExpanded
      ) {
        instance.resetExpanded()
      }
    },
    setExpanded: updater =>
      instance.options.onExpandedChange?.(
        updater,
        functionalUpdate(updater, instance.getState().expanded)
      ),
    toggleRowExpanded: (rowId, expanded) => {
      if (!rowId) return

      instance.setExpanded((old = {}) => {
        const exists = old === true ? true : !!old?.[rowId]

        let oldExpanded: ExpandedStateList = {}

        if (old === true) {
          Object.keys(instance.getRowsById()).forEach(rowId => {
            oldExpanded[rowId] = true
          })
        } else {
          oldExpanded = old
        }

        expanded = expanded ?? !exists

        if (!exists && expanded) {
          return {
            ...oldExpanded,
            [rowId]: true,
          }
        }

        if (exists && !expanded) {
          const { [rowId]: _, ...rest } = oldExpanded
          return rest
        }

        return old
      })
    },
    toggleAllRowsExpanded: expanded => {
      if (expanded ?? !instance.getIsAllRowsExpanded()) {
        instance.setExpanded(true)
      } else {
        instance.setExpanded({})
      }
    },
    resetExpanded: () => {
      instance.setExpanded(instance.options?.initialState?.expanded ?? {})
    },
    getIsRowExpanded: rowId => {
      const row = instance.getRow(rowId)

      if (!row) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[ReactTable] getIsRowExpanded: no row found with id ${rowId}`
          )
        }
        throw new Error()
      }

      const expanded = instance.getState().expanded

      return !!(
        instance.options.getIsRowExpanded?.(row) ??
        (expanded || expanded?.[rowId])
      )
    },
    getRowCanExpand: rowId => {
      const row = instance.getRow(rowId)

      if (!row) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[ReactTable] getRowCanExpand: no row found with id ${rowId}`
          )
        }
        throw new Error()
      }

      return (
        instance.options.getRowCanExpand?.(row) ??
        instance.options.enableExpanded ??
        instance.options.defaultCanExpand ??
        !!row.subRows?.length
      )
    },
    getToggleExpandedProps: (rowId, userProps) => {
      const row = instance.getRow(rowId)

      if (!row) {
        return
      }

      const canExpand = instance.getRowCanExpand(rowId)

      const initialProps: ToggleExpandedProps = {
        title: canExpand ? 'Toggle Expanded' : undefined,
        onClick: canExpand
          ? (e: MouseEvent | TouchEvent) => {
              e.persist()
              instance.toggleRowExpanded(rowId)
            }
          : undefined,
      }

      return propGetter(initialProps, userProps)
    },
    getToggleAllRowsExpandedProps: userProps => {
      const initialProps: ToggleExpandedProps = {
        title: 'Toggle All Expanded',
        onClick: (e: MouseEvent | TouchEvent) => {
          e.persist()
          instance.toggleAllRowsExpanded()
        },
      }

      return propGetter(initialProps, userProps)
    },
    getIsAllRowsExpanded: () => {
      const expanded = instance.getState().expanded

      // If expanded is true, save some cycles and return true
      if (expanded === true) {
        return true
      }

      // If any row is not expanded, return false
      if (
        Object.keys(instance.getRowsById()).some(
          id => !instance.getIsRowExpanded(id)
        )
      ) {
        return false
      }

      // They must all be expanded :shrug:
      return true
    },
    getExpandedDepth: () => {
      let maxDepth = 0

      const rowIds =
        instance.getState().expanded === true
          ? Object.keys(instance.getRowsById())
          : Object.keys(instance.getState().expanded)

      rowIds.forEach(id => {
        const splitId = id.split('.')
        maxDepth = Math.max(maxDepth, splitId.length)
      })

      return maxDepth
    },
    getExpandedRowModel: memo(
      () => [
        instance.getState().expanded,
        instance.getGroupedRowModel(),
        instance.options.expandRowsFn,
        instance.options.paginateExpandedRows,
      ],
      (expanded, rowModel, expandRowsFn, paginateExpandedRows) => {
        if (
          !expandRowsFn ||
          // Do not expand if rows are not included in pagination
          !paginateExpandedRows ||
          !Object.keys(expanded ?? {}).length
        ) {
          return rowModel
        }

        if (process.env.NODE_ENV !== 'production' && instance.options.debug)
          console.info('Expanding...')

        return expandRowsFn(instance, rowModel)
      },
      {
        key: 'getExpandedRowModel',
        debug: instance.options.debug,
        onChange: () => instance._notifyPageIndexReset(),
      }
    ),

    getPreExpandedRows: () => instance.getGroupedRowModel().rows,
    getPreExpandedFlatRows: () => instance.getGroupedRowModel().flatRows,
    getPreExpandedRowsById: () => instance.getGroupedRowModel().rowsById,
    getExpandedRows: () => instance.getExpandedRowModel().rows,
    getExpandedFlatRows: () => instance.getExpandedRowModel().flatRows,
    getExpandedRowsById: () => instance.getExpandedRowModel().rowsById,
  }
}

export function createRow<
  TData,
  TValue,
  TFilterFns,
  TSortingFns,
  TAggregationFns
>(
  row: Row<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>,
  instance: ReactTable<TData, TValue, TFilterFns, TSortingFns, TAggregationFns>
): ExpandedRow {
  return {
    toggleExpanded: expanded =>
      void instance.toggleRowExpanded(row.id, expanded),
    getIsExpanded: () => instance.getIsRowExpanded(row.id),
    getCanExpand: () => row.subRows && !!row.subRows.length,
    getToggleExpandedProps: userProps => {
      const initialProps: ToggleExpandedProps = {
        title: 'Toggle Row Expanded',
        onClick: (e: MouseEvent | TouchEvent) => {
          e.stopPropagation()
          instance.toggleRowExpanded(row.id)
        },
      }
      return propGetter(initialProps, userProps)
    },
  }
}
