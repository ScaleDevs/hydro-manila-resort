import { Stack } from '@chakra-ui/react';
import * as React from 'react';
import { Control, useFieldArray, UseFormRegister } from 'react-hook-form';

export interface IDayRatesInputProps {
  control: Control<any, any>;
  register: UseFormRegister<any>;
}

export function DayRatesInput(props: IDayRatesInputProps) {
  const { fields, append, remove } = useFieldArray({
    control: props.control,
    name: 'dayRates',
  });

  return (
    <Stack>
      {fields.map((field, index) => (
        <div key={field.id} className='border p-4 mb-2 rounded-md'>
          <label>Days of Week</label>
          <div className='flex gap-2 flex-wrap'>
            {[...Array(7).keys()].map((day) => (
              <label key={day}>
                <input type='checkbox' value={day} {...props.register(`dayRates.${index}.days`)} />
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
              </label>
            ))}
          </div>

          <label>Price</label>
          <input
            type='number'
            step='any'
            {...props.register(`dayRates.${index}.price`, { valueAsNumber: true })}
            className='border px-2 py-1 rounded'
          />

          <button type='button' onClick={() => remove(index)} className='text-red-500'>
            Remove
          </button>
        </div>
      ))}

      <button type='button' onClick={() => append({ days: [], price: 0 })} className='bg-blue-500 text-white px-3 py-1 rounded'>
        Add Day Rate
      </button>
    </Stack>
  );
}
