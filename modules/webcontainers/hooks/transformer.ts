interface TemplateItem {
  filename?: string;
  fileExtension?: string;
  content?: string;
  folderName?: string;
  items?: TemplateItem[];
}

interface WebContainerFile {
  file: {
    contents: string;
  };
}

interface WebContainerDirectory {
  directory: {
    [key: string]: WebContainerFile | WebContainerDirectory;
  };
}

type WebContainerFileSystem = Record<string, WebContainerFile | WebContainerDirectory>;

export function transformToWebContainerFormat(template: { folderName: string; items: any[] }): WebContainerFileSystem {
  if (!template || !template.items || !Array.isArray(template.items)) {
    throw new Error('Invalid template data: template must have items array');
  }

  function processItem(item: TemplateItem): WebContainerFile | WebContainerDirectory {
    if (!item) {
      throw new Error('Invalid item: item cannot be null or undefined');
    }

    if (item.folderName && item.items) {
      // This is a directory
      if (!Array.isArray(item.items)) {
        throw new Error(`Invalid directory "${item.folderName}": items must be an array`);
      }

      const directoryContents: WebContainerFileSystem = {};

      item.items.forEach((subItem, index) => {
        if (!subItem) {
          console.warn(`Skipping null/undefined item at index ${index} in directory "${item.folderName}"`);
          return;
        }

        try {
          const key = subItem.fileExtension && subItem.filename ? `${subItem.filename}.${subItem.fileExtension}` : subItem.folderName;

          if (!key) {
            console.warn(`Skipping item with no filename/folderName at index ${index} in directory "${item.folderName}"`);
            return;
          }

          directoryContents[key] = processItem(subItem);
        } catch (error) {
          console.error(`Error processing item at index ${index} in directory "${item.folderName}":`, error);
          throw error;
        }
      });

      return {
        directory: directoryContents,
      };
    } else {
      // This is a file
      if (!item.filename || !item.fileExtension) {
        throw new Error(`Invalid file: filename (${item.filename}) and fileExtension (${item.fileExtension}) are required`);
      }

      if (typeof item.content !== 'string') {
        console.warn(`File "${item.filename}.${item.fileExtension}" has non-string content, converting to string`);
      }

      return {
        file: {
          contents: String(item.content || ''),
        },
      };
    }
  }

  const result: WebContainerFileSystem = {};

  template.items.forEach((item, index) => {
    if (!item) {
      console.warn(`Skipping null/undefined item at index ${index} in root template`);
      return;
    }

    try {
      // Log the item structure for debugging
      console.log(`Processing root item ${index}:`, {
        filename: item.filename,
        fileExtension: item.fileExtension,
        folderName: item.folderName,
        hasItems: !!item.items,
        itemsCount: item.items?.length,
      });

      const key = item.fileExtension && item.filename ? `${item.filename}.${item.fileExtension}` : item.folderName;

      if (!key) {
        console.warn(`Skipping item with no filename/folderName at index ${index} in root template`, {
          item,
          filename: item.filename,
          fileExtension: item.fileExtension,
          folderName: item.folderName,
        });
        return;
      }

      result[key] = processItem(item);
    } catch (error) {
      console.error(`Error processing root item at index ${index}:`, error, { item });
      throw error;
    }
  });

  return result;
}
