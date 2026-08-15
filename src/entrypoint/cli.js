#!/usr/bin/env node

import { parseArgs } from 'node:util';

const args = process.argv.slice(2)

const options = /** @type {const} */({
	'no-antialias': {
		type: 'boolean',
		short: 'A',
		description: "by default, it will consider different pixels due to antialiasing to be equal, this flag disables it",
	},
	threshold: {
		type: 'string',
		short: 't',
		default: "10",
		description: "colors with distance below the threshold is considered equal",
		valueLabel: "num"
	},
	help: {
		type: 'boolean',
		short: 'h',
		description: "only show this help and exit"
	},
	verbose: {
		type: 'boolean',
		short: 'v',
		description: "show verbose output, without it, only the amount of different pixels will be printed on stdout"
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

let parsedArgs
try {
	parsedArgs = parseArgs({ args, options, allowPositionals: true })
} catch (e) {
	console.error(e instanceof Error ? e.message : e)
	console.error()
	console.error(help)
	process.exit(64);
}

const { values, positionals } = parsedArgs;

if(positionals.length < 2){
	console.error("Error: not enough parameters")
  console.error()
	console.error(help)
	process.exit(64);
}

if(values.help){
	console.log(help)
	process.exit(0);
}

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

if(values.verbose){ console.time('matched in') }

const {calculateDiff} = await import('../utils/color-diff.js');

const result = calculateDiff({
	img1: img1.data,
	img2: img2.data,
	output: diff?.data,
	width,
	height,
	threshold: +(values.threshold ?? options.threshold.default),
	antialias: !values["no-antialias"] 
})
	
if(values.verbose){
	console.timeEnd('matched in')
	console.log(`different pixels: ${result.diffPixelAmount}`);
	console.log(`antialias pixels: ${result.aaPixelAmount}`);
	console.log(`error: ${Math.round(100 * 100 * result.diffPixelAmount / (width * height)) / 100}%`);
} else {
	console.log(result.diffPixelAmount)
}

if (diff) {
	fs.writeFileSync(diffPath, PNG.sync.write(diff));
}
process.exit(result.diffPixelAmount ? 3 : 0);