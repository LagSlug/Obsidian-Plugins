export const InputMode = ['SMILES', 'FORMULA', 'IUPAC'] as const;
export type InputModeTypes = typeof InputMode[number];


export const Labels = {

  insertChemicalStructureSVGModal: {
    header: 'Insert Chemical Structure SVG',
    
    previewCheckbox: 'Show Preview',
    optionsCheckbox: 'Show Options',
    submitButton: 'Add SVG',
  
    options: {
      height: 'Height',
      width: 'Width'
    }

  },
  settings: {
    dropdown: {
      iupac: 'IUPAC Name',
      smiles: 'SMILES',
      formula: 'Formula'
    },
  }
};