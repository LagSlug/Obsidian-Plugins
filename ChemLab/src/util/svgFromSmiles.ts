import OCL from 'openchemlib'
import axios from 'axios';
import { load } from 'cheerio';
// import pretty from 'pretty';
import { titleCase } from 'title-case';
import shortid from 'shortid';

// let molecule = OCL.Molecule.fromSmiles("CCCC");
// let formula = molecule.getMolecularFormula();

// molecule.setName("Butane")
// let name = molecule.getName();

// console.log(molecule.toSVG(1, 1, undefined, {  }))
// console.log(name);

const buildCactusUrl = (smiles: string) => {
  return `https://cactus.nci.nih.gov/chemical/structure/${smiles}/iupac_name`
}

type Options = {
  height: number;
  width: number;
  autoCrop: boolean;
}
const DEFAULT_OPTIONS: Options = { height: 100, width: 100, autoCrop: false };

export async function svgFromSmiles(smiles: string, options?: Partial<Options>) {
  const filledOptions: Options = Object.assign({}, DEFAULT_OPTIONS, options);

  const { data: iupacName } = await axios.get(buildCactusUrl(smiles));

  const iupacNameTitleCase = titleCase((iupacName || "").toLowerCase());
  let id = iupacName + '-' + shortid();

  let molecule = OCL.Molecule.fromSmiles(smiles);
  let svg = molecule.toSVG(filledOptions.width, filledOptions.height, id, { autoCrop: filledOptions.autoCrop });
  let element = load(svg)('svg');
  element.append(`  <text x="0" y="15" fill="black">${iupacNameTitleCase}</text>\n`)
  const source = element.prop('outerHTML') || '';

  return source;
}

export default svgFromSmiles;