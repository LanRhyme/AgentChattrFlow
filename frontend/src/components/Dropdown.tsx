import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  id: string | number;
  name: string;
}

interface DropdownProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export const Dropdown = ({ value, onChange, options, placeholder, label }: DropdownProps) => {
  const selected = options.find(opt => String(opt.id) === String(value)) || options[0];

  return (
    <div className="space-y-2 w-full">
      {label && <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">{label}</label>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default bg-on-surface/[0.03] border border-brand-border rounded-[20px] py-3 pl-5 pr-12 text-left text-sm text-on-surface focus:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-inner">
            <span className="block truncate">{selected?.name || placeholder}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-[200] mt-2 max-h-60 w-full overflow-auto rounded-[24px] bg-brand-panel border border-brand-border py-2 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none custom-scrollbar animate-in fade-in slide-in-from-top-2">
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  className={({ active }) =>
                    cn(
                      'relative cursor-default select-none py-3 pl-10 pr-4 transition-colors mx-2 rounded-xl',
                      active ? 'bg-primary/10 text-primary' : 'text-on-surface'
                    )
                  }
                  value={option.id}
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className={cn('block truncate text-[13px]', isSelected ? 'font-bold' : 'font-normal')}>
                        {option.name}
                      </span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};
