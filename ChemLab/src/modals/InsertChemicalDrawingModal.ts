import { 
  App, 
  Component,
  ButtonComponent, 
  DropdownComponent, 
  TextComponent,
  Modal,
  BaseComponent,
} from 'obsidian';

import * as CSS from 'csstype';

export type OnSubmitHandler = (input: string) => void;

import { Labels } from '../consts';
const ModalLabels = Labels.insertChemicalStructureSVGModal;

import ChemDrawSvgPlugin from '../main';
import { SettingsFactory } from '../settings';

const Styles: {[ n: string ]: CSS.Properties } = {

  chemicalInput: {
    flexGrow: 1
  },
  dropdown: {
    flexGrow: 0,
    minWidth: '115px',
    marginLeft: '10px'
  },

  toggleRibbon: {
    paddingTop: '15px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-start'
  },

  optionsPanel: {
    marginTop: '10px',
    borderTop: '1px solid grey',
    paddingTop: '10px',
    display: 'flex',
    gap: '10px'
  },

  heightWidthContainer: {
    display: 'flex',
    gap: '10px',
    flexDirection: 'column'
  },
  submitButton: {
    display: 'block',
    minWidth: '115px'
  },

  optionsHeightLabel: {
    minWidth: '60px',
    display: 'inline-block'
  },

  optionsWidthLabel: {
    minWidth: '60px',
    display: 'inline-block'
  },

  optionsHeightInput: {
    marginLeft: '10px'
  },
  optionsWidthInput: {
    marginLeft: '10px'
  }
};




export default class InsertChemicalDrawingModal extends Modal {
  private onSubmitHandler: OnSubmitHandler = ()=>{}
  private plugin: ChemDrawSvgPlugin;
  private input: string = "";

  private previewPanel: DivComponent | null = null;
  private optionsPanel: DivComponent | null = null;

  private factory: SettingsFactory;
	constructor(plugin: ChemDrawSvgPlugin) {
		super(plugin.app);
    this.plugin = plugin;
    this.factory = plugin.settingsFactory;
	}

  onSubmit(onSubmitHandler: OnSubmitHandler) {
    this.onSubmitHandler = onSubmitHandler;
  }

	onOpen() {
		this.buildInterface()
	}

  private submit() {
    this.onSubmitHandler(this.input);
  }

  buildInterface() {
    const { contentEl } = this;

    // create the header
    contentEl.createEl('h2', { text: ModalLabels.header });

    // create a container for the textbox and dropdown menu, and submit button
    const mainContainer = new DivComponent(contentEl);
    mainContainer.setStyle({
      display: 'flex',
      gap: '10px',
      alignItems: 'center' 
    });

    // add the textbox for inputing a chemical formula, SMILES notation, or IUPAC name
    const chemicalInput = this.buildChemicalInput(mainContainer.divEl);

    // add input mode dropdown
    const dropdown = this.factory.createInputModeDropdown(mainContainer.divEl);
    
    // add submit button
    const submitButton = this.buildSubmitButton(mainContainer.divEl);

    // create a container for the toggle switches
    this.buildToggleRibbon(contentEl);

    this.optionsPanel = this.buildOptionsPanel(contentEl);
    if(this.plugin.settings.showOptions === false) {
      this.hideOptions();
    }

    this.previewPanel = this.buildPreviewPanel(contentEl);
    if(this.plugin.settings.showPreview === false){ 
      this.hidePreview();
    } 
  }

  private buildSubmitButton(parent: HTMLElement) {
    const submitButton = new ButtonComponent(parent);
    Object.assign(submitButton.buttonEl.style, Styles.submitButton);
    submitButton.setButtonText(ModalLabels.submitButton);
    submitButton.setCta();
    submitButton.onClick(()=>this.submit());
    return submitButton;
  } 

  private buildChemicalInput(parent: HTMLElement) {
    const textbox = new TextComponent(parent);
    Object.assign(textbox.inputEl.style, Styles.chemicalInput);
    textbox.setValue(this.input);
    textbox.onChange(value=>this.input = value);

    // handle when the Enter key is pressed when the textbox is focused
    textbox.inputEl.on('keypress', 'input', (event) => {
      if(event.key !== 'Enter') return;
      this.submit();      
    });
    return textbox;
  }

  private buildToggleRibbon(parent: HTMLElement) {
    const toggleContainer = new DivComponent(parent);
    toggleContainer.setStyle(Styles.toggleRibbon);

    /* SHOW PREVIEW */
    const showPreviewContainer = new DivComponent(toggleContainer.divEl);
    showPreviewContainer.setStyle({
      display: 'flex',
      alignItems: 'center'
    });
    const showPreviewToggle = this.factory.createShowPreviewToggle(showPreviewContainer.divEl);
    const showPreviewLabel = new DivComponent(showPreviewContainer.divEl);
    showPreviewLabel.setStyle({
      paddingLeft: '10px'
    });
    showPreviewLabel.setText('Show Preview');
    showPreviewLabel.onClick(()=>{
      showPreviewToggle.toggle();
    });
    showPreviewToggle.onChange((value)=>{
      value ? this.showPreview() : this.hidePreview();
    })

    /* SHOW OPTIONS */
    const showOptionsContainer = new DivComponent(toggleContainer.divEl);
    showOptionsContainer.setStyle({
      display: 'flex',
      alignItems: 'center'
    });
    const showOptionsToggle = this.factory.createShowOptionsToggle(showOptionsContainer.divEl);
    const showOptionsLabel = new DivComponent(showOptionsContainer.divEl);
    showOptionsLabel.setStyle({
      paddingLeft: '10px'
    });
    showOptionsLabel.setText('Show Options');
    showOptionsLabel.onClick(()=>{
      showOptionsToggle.toggle();
    });

    showOptionsToggle.onChange((value)=>{
      value ? this.showOptions() : this.hideOptions();
    })
    return toggleContainer;
  }

  private buildOptionsPanel(parent: HTMLElement) {
    // Height and width options container
    const panel = new DivComponent(parent);
    panel.setStyle(Styles.optionsPanel);
    panel.setId('options-panel')
    const heightWidthContainer = new DivComponent(panel.divEl);
    heightWidthContainer.setStyle(Styles.heightWidthContainer);

    /* HEIGHT */
    const heightContainer = new DivComponent(heightWidthContainer.divEl);    
    const heightLabel = new DivComponent(heightContainer.divEl);
    heightLabel.setText(ModalLabels.options.height);
    heightLabel.setStyle(Styles.optionsHeightLabel);
    const heightInput = this.factory.createHeightInput(heightContainer.divEl);
    
    /* WIDTH */
    const widthContainer = new DivComponent(heightWidthContainer.divEl);
    const widthLabel = new DivComponent(widthContainer.divEl);
    widthLabel.setText(ModalLabels.options.width);
    widthLabel.setStyle(Styles.optionsWidthLabel);
    const widthtInput = this.factory.createWidthInput(widthContainer.divEl);

    /* AUTO CROP */
    const autoCropContainer = new DivComponent(panel.divEl);
    autoCropContainer.setStyle({
      display: 'flex',
      gap: '10px',
      paddingTop: '3px'
    })
    const autoCropToggle = this.factory.createAutoCropToggle(autoCropContainer.divEl);
    const autoCropLabel = new DivComponent(autoCropContainer.divEl);
    autoCropLabel.setText('Auto Crop');
    autoCropLabel.onClick(()=>autoCropToggle.toggle());
    return panel;
  }

  buildPreviewPanel(parent: HTMLElement) {
    const panel = new DivComponent(parent);
    panel.setStyle({
      height: '520px',
      width: '100%',
    });

    return panel;
  }

  showOptions() {
    if(this.optionsPanel) this.optionsPanel.show();
  }

  hideOptions() {
    if(this.optionsPanel) this.optionsPanel.hide();
  }

  showPreview() {
    if(this.previewPanel) this.previewPanel.show();
  }

  hidePreview() {
    if(this.previewPanel) this.previewPanel.hide();
  }

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
  

}




class DivComponent extends Component {
  divEl: HTMLDivElement;
  onClickCallbacks: (()=>void)[] = [];
  displayBeforeHide: CSS.Properties['display']
  constructor(parent: HTMLElement) {
    super();
    this.divEl = parent.createDiv();
    this.divEl.onClickEvent(()=>{
      this.onClickCallbacks.forEach(callback=>callback.bind(this)());
    })
  }

  setId(id: string) {
    this.divEl.setAttr('id', id);
  }
  onClick(callback: ()=>void) {
    this.onClickCallbacks.push(callback);
  }

  setText(value: string) {
    this.divEl.setText(value);
    return this;
  }

  setStyle(style: CSS.Properties) {
    Object.assign(this.divEl.style, style);
    return this;
  }
  getStyle<K extends keyof CSS.Properties>(key: K): CSS.Properties[K] {
    return this.divEl.style[key as keyof CSSStyleDeclaration] as CSS.Properties[K];
  }

  hide() {
    this.displayBeforeHide = this.getStyle('display');
    this.setStyle({ display: 'none' })
  }

  show() {
    this.setStyle({ display: this.displayBeforeHide })
  }
}
