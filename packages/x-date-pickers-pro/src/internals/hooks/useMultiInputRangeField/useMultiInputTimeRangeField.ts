import useEventCallback from '@mui/utils/useEventCallback';
import { unstable_useTimeField as useTimeField } from '@mui/x-date-pickers/TimeField';
import {
  FieldChangeHandler,
  FieldChangeHandlerContext,
  UseFieldResponse,
  useControlledValueWithTimezone,
  useDefaultizedTimeField,
} from '@mui/x-date-pickers/internals';
import { useValidation } from '@mui/x-date-pickers/validation';
import { PickerValidDate, TimeValidationError } from '@mui/x-date-pickers/models';
import { validateTimeRange } from '../../../validation';
import { TimeRangeValidationError, DateRange } from '../../../models';
import type {
  UseMultiInputTimeRangeFieldParams,
  UseMultiInputTimeRangeFieldProps,
} from '../../../MultiInputTimeRangeField/MultiInputTimeRangeField.types';
import { rangeValueManager } from '../../utils/valueManagers';
import type { UseMultiInputRangeFieldResponse } from './useMultiInputRangeField.types';
import { excludeProps } from './shared';
import { useMultiInputFieldSelectedSections } from '../useMultiInputFieldSelectedSections';

export const useMultiInputTimeRangeField = <
  TDate extends PickerValidDate,
  TEnableAccessibleFieldDOMStructure extends boolean,
  TTextFieldSlotProps extends {},
>({
  sharedProps: inSharedProps,
  startTextFieldProps,
  unstableStartFieldRef,
  endTextFieldProps,
  unstableEndFieldRef,
}: UseMultiInputTimeRangeFieldParams<
  TDate,
  TEnableAccessibleFieldDOMStructure,
  TTextFieldSlotProps
>): UseMultiInputRangeFieldResponse<TEnableAccessibleFieldDOMStructure, TTextFieldSlotProps> => {
  const sharedProps = useDefaultizedTimeField<
    TDate,
    UseMultiInputTimeRangeFieldProps<TDate, TEnableAccessibleFieldDOMStructure>,
    typeof inSharedProps
  >(inSharedProps);

  const {
    value: valueProp,
    defaultValue,
    format,
    formatDensity,
    shouldRespectLeadingZeros,
    onChange,
    disabled,
    readOnly,
    selectedSections,
    onSelectedSectionsChange,
    timezone: timezoneProp,
    enableAccessibleFieldDOMStructure,
    autoFocus,
  } = sharedProps;

  const { value, handleValueChange, timezone } = useControlledValueWithTimezone({
    name: 'useMultiInputDateRangeField',
    timezone: timezoneProp,
    value: valueProp,
    defaultValue,
    onChange,
    valueManager: rangeValueManager,
  });

  const { validationError, getValidationErrorForNewValue } = useValidation({
    props: sharedProps,
    validator: validateTimeRange,
    value,
    timezone,
    onError: sharedProps.onError,
  });

  // TODO: Maybe export utility from `useField` instead of copy/pasting the logic
  const buildChangeHandler = (
    index: 0 | 1,
  ): FieldChangeHandler<TDate | null, TimeValidationError> => {
    return (newDate, rawContext) => {
      const newDateRange: DateRange<TDate> =
        index === 0 ? [newDate, value[1]] : [value[0], newDate];

      const context: FieldChangeHandlerContext<TimeRangeValidationError> = {
        ...rawContext,
        validationError: getValidationErrorForNewValue(newDateRange),
      };

      handleValueChange(newDateRange, context);
    };
  };

  const handleStartDateChange = useEventCallback(buildChangeHandler(0));
  const handleEndDateChange = useEventCallback(buildChangeHandler(1));

  const selectedSectionsResponse = useMultiInputFieldSelectedSections({
    selectedSections,
    onSelectedSectionsChange,
    unstableStartFieldRef,
    unstableEndFieldRef,
  });

  const startFieldProps = {
    error: !!validationError[0],
    ...startTextFieldProps,
    ...selectedSectionsResponse.start,
    disabled,
    readOnly,
    format,
    formatDensity,
    shouldRespectLeadingZeros,
    timezone,
    value: valueProp === undefined ? undefined : valueProp[0],
    defaultValue: defaultValue === undefined ? undefined : defaultValue[0],
    onChange: handleStartDateChange,
    enableAccessibleFieldDOMStructure,
    autoFocus, // Do not add on end field.
  };

  const endFieldProps = {
    error: !!validationError[1],
    ...endTextFieldProps,
    ...selectedSectionsResponse.end,
    format,
    formatDensity,
    shouldRespectLeadingZeros,
    disabled,
    readOnly,
    timezone,
    value: valueProp === undefined ? undefined : valueProp[1],
    defaultValue: defaultValue === undefined ? undefined : defaultValue[1],
    onChange: handleEndDateChange,
    enableAccessibleFieldDOMStructure,
  };

  const startDateResponse = useTimeField<
    TDate,
    TEnableAccessibleFieldDOMStructure,
    typeof startFieldProps
  >(startFieldProps) as UseFieldResponse<TEnableAccessibleFieldDOMStructure, TTextFieldSlotProps>;

  const endDateResponse = useTimeField<
    TDate,
    TEnableAccessibleFieldDOMStructure,
    typeof endFieldProps
  >(endFieldProps) as UseFieldResponse<TEnableAccessibleFieldDOMStructure, TTextFieldSlotProps>;

  /* TODO: Undo this change when a clearable behavior for multiple input range fields is implemented */
  return {
    startDate: excludeProps(startDateResponse, ['clearable', 'onClear']),
    endDate: excludeProps(endDateResponse, ['clearable', 'onClear']),
  };
};
