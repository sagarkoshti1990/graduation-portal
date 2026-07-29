type OpenFilePickerProps = {
    allowMultiSelection?: boolean;
    type?: string[];
  };

  export const openFilePicker = async ({
    allowMultiSelection = true,
    type = ['*/*'],
  }: OpenFilePickerProps) => {
    return new Promise<any[]>((resolve) => {
      const input = document.createElement('input');

      input.type = 'file';
      input.multiple = allowMultiSelection;
      input.accept = type.join(',');

      input.onchange = (event: any) => {
        const files = Array.from(
          event.target.files || [],
        );

        resolve(
          files.map((file: File) => ({
            uri: URL.createObjectURL(file),
            type: file.type,
            name: file.name,
            size: file.size,
            file,
          })),
        );
      };

      input.click();
    });
  };
