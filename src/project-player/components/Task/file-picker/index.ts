import {pick} from '@react-native-documents/picker';

type OpenFilePickerProps = {
  allowMultiSelection?: boolean;
  type?: string[];
};

export const openFilePicker = async ({
  allowMultiSelection = true,
  type = ['*/*'],
}: OpenFilePickerProps) => {
  const result = await pick({
    allowMultiSelection,
    type,
  });

  return Array.isArray(result)
    ? result
    : [result];
};