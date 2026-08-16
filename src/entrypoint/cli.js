#!/usr/bin/env node

import { parseArgs } from 'node:util';

const args = process.argv.slice(2)

const newlinePad = "".padEnd(43)
const options = /** @type {const} */({
	threshold: {
		type: 'string',
		short: 't',
		default: "0",
		description: "Sets a threshold in percents, colors with distance below the threshold are considered equal",
		valueLabel: "num"
	},
	'antialias': {
		type: 'boolean',
		short: 'a',
		description: "Activates antialias. When active it will consider different pixels due to antialiasing to be equal",
	},
	help: {
		type: 'boolean',
		short: 'h',
		description: "Only show this help and exit"
	},
	verbose: {
		type: 'boolean',
		short: 'v',
		description: "Show verbose output, without it, only the amount of different pixels will be printed on stdout"
	},
	"output-format": {
		type: 'string',
		short: 'f',
		description: `Output format, overrides --verbose. Interpreted sequences: 
${newlinePad}%d   amount of different pixels
${newlinePad}%a   amount of antialias pixels
${newlinePad}%p   percentage of diff pixels compared to the total amount of pixels image
${newlinePad}%t   time spend calculating diff
${newlinePad}%%   literal %  `
	},
});


const help = `Usage: its-an-image-comparison [Options] image1.png image2.png [diff.png]

Options:${Object.entries(options).map(([entry, option]) => {
	const valueLabel = "valueLabel" in option ? ` ${option.valueLabel}` : ""
	const shortParam = option.short ? `-${option.short+valueLabel}, `: ""
	const longParam = `--${entry+valueLabel}`
	return `
	${(shortParam+longParam).padEnd(30)} ${option.description}`
}).join()}`

const logInputErrorAndExit = (messageToLog) => {
  console.error(messageToLog)
	console.error()
	console.error(help)
	return process.exit(64)
}

let parsedArgs
try {
	parsedArgs = parseArgs({ args, options, allowPositionals: true })
} catch (e) {
	logInputErrorAndExit(e instanceof Error ? e.message : e);
}

const { values, positionals } = parsedArgs;

if(values.help){
	console.log(help)
	process.exit(0);
}

if(positionals.length < 2){ logInputErrorAndExit("Error: not enough parameters"); }
if(isNaN(values.threshold)){ logInputErrorAndExit("Error: threshold must be a number between 0 and 100"); }

const [img1Path, img2Path, diffPath] = positionals;

const {default: fs} = await import('node:fs');


const isImg1Found = fs.statSync(img1Path, {throwIfNoEntry: false})?.isFile()
const isImg2Found = fs.statSync(img2Path, {throwIfNoEntry: false})?.isFile()
if(!isImg1Found) { console.error(`Error: image "${img1Path}" not found`) }
if(!isImg2Found) { console.error(`Error: image "${img2Path}" not found`) }
if(!isImg1Found || !isImg2Found) { 	process.exit(64); }

const {PNG} = await import('pngjs');

const img1 = PNG.sync.read(fs.readFileSync(img1Path));
const img2 = PNG.sync.read(fs.readFileSync(img2Path));

const {width, height} = img1;

if (img2.width !== width || img2.height !== height) {
	console.error(`Image dimensions do not match: ${width}x${height} vs ${img2.width}x${img2.height}`);
	process.exit(65);
}

const diff = diffPath ? new PNG({width, height}) : null;

const {calculateDiff} = await import('../utils/color-diff.js');

performance.mark("startDiffCalc")
const result = calculateDiff({
	img1: img1.data,
	img2: img2.data,
	output: diff?.data,
	width,
	height,
	threshold: +(values.threshold ?? options.threshold.default),
	antialias: values.antialias 
})
performance.mark("endDiffCalc")
performance.measure("diffCalcDuration", "startDiffCalc", "endDiffCalc");
const measure = performance.getEntriesByName("diffCalcDuration")[0]; 
const time = measure.duration.toFixed(3); 

const format = values['output-format'] || (values.verbose ? `matched in: %tms
different pixels: %d
${values.antialias ? "antialias pixels: %a\n" : ""
}error: %p%%` : '%d')

const match = {
	"%t": time,
  "%d": result.diffPixelAmount,
	"%a": result.aaPixelAmount,
	"%p": Math.round(100 * 100 * result.diffPixelAmount / (width * height)) / 100,
	"%%": "%"
}
const textToLog = format.replaceAll(/%([tdap%])/g, matched => match[matched])

console.log(textToLog)

if (diff) {
	fs.writeFileSync(diffPath, PNG.sync.write(diff));
}
process.exit(result.diffPixelAmount ? 3 : 0);