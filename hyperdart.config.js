import pkg from './package.json' with {type:'json'}

export default  {
	// import name from package.json
	name: pkg.name,
	triggers: {
  keywords: [
    'npm',
    'package info',
    'packages like',
    'compare packages',
    'best npm package for',
    'npm package for',
    'library for',
    'best library for',
    'javascript library for',
    'typescript library for',
    'npm alternatives',
    'package comparison',
    'npm install',
    'npm dependencies',
    'package size',
    'typescript support',
    'esm support',
    'node compatibility'
  ],
},
	query_format: {
		regex: [
    '(npm( packages?)?|package info) HD_PACKAGES.NPM_PACKAGES',
    '(latest|current) version of HD_PACKAGES.NPM_PACKAGES',
    'compare( npm)?( packages?)? HD_PACKAGES.NPM_PACKAGES(,| vs| versus| and)? HD_PACKAGES.NPM_PACKAGES((,| vs| versus| and)? HD_PACKAGES.NPM_PACKAGES)?',
    '(npm )?(alternatives?( to| for)|packages? (like|similar to)) HD_PACKAGES.NPM_PACKAGES( npm)?',
    'HD_PACKAGES.NPM_PACKAGES[ @]v?[0-9]+(\\.[0-9]+)*(,| vs| versus| and) (HD_PACKAGES.NPM_PACKAGES[ @])?v?[0-9]+',
    '(tell me about|information about|details of) HD_PACKAGES.NPM_PACKAGES',
    'HD_PACKAGES.NPM_PACKAGES (vs|versus) HD_PACKAGES.NPM_PACKAGES',
    '(is|was) HD_PACKAGES.NPM_PACKAGES deprecated',
    '(install|size|typescript support|esm support|node compatibility|dependencies) (of|for)? HD_PACKAGES.NPM_PACKAGES',
    'HD_PACKAGES.NPM_PACKAGES (alternatives|latest version)',
    '(best|recommended|popular) (npm )?(package|library) for HD_DICTIONARY_WORD.WORDS',
    '(npm )?(package|library) for HD_DICTIONARY_WORD.WORDS'
  ],},
  
	client: {
		// location of client side code
		// should point to pkg.umd - but currently that points to dist/index.umd.js
		location: pkg.module,
		// name of the UMD module
		moduleName: pkg.umdName || 'HD' + pkg.name,
		// baseURL is only used in local testing and ignored after publish
		// Optional: defaults to '/name' (the name of the component)
		baseURL: '/' + pkg.name,

	},
	format: {
		mainline: true,
		sidebar: true
		// "sidebar" / "mainline" / "ribbon" / "fullscreen"
	},
	permissions: {
		
	},
	info: {
		// key-values added here will be added to the compInfo section of searchData
	},
	github: "",
	demovideo: "https://drive.google.com/file/d/1Cd2wl0iI-xe4lVFwbfBK9ZC_asf3v8xq/view?usp=sharing"
}
