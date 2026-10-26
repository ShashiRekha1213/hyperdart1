# Package Insight

### Discover, Compare, and Choose npm Packages with Confidence

Package Insight is a React-based npm package explorer built as a standalone **hyperDart component**. It helps developers explore npm packages, compare libraries, discover alternatives, and understand package information through natural-language queries.

Instead of visiting multiple websites to research packages, developers can access useful package information in one interface.

## Features

### 1. Package Details

Explore npm packages and view information such as:

* Package name and description
* Latest available version
* Dependencies
* Repository information, when available
* npm download statistics
* Package metadata and compatibility signals, when available

**Example queries:**

```text
npm express
tell me about react
latest version of axios
```

### 2. Package Comparison

Compare two or three npm packages side by side to understand their differences.

**Example queries:**

```text
compare react and vue
express vs fastify
compare express, fastify, koa
```

### 3. Package Alternatives

Discover npm packages related to an existing library.

**Example queries:**

```text
alternatives to moment
packages similar to lodash
```

Alternative suggestions use npm search results and available package metadata. They are intended as starting points for evaluation, not definitive quality rankings.

### 4. Version Comparison

Explore differences between package versions using available version metadata.

**Example query:**

```text
express 4 vs 5
```

### 5. Use-Case-Based Package Discovery

Search for libraries based on development requirements.

**Example queries:**

```text
best npm package for date formatting
npm library for validation
```

### 6. Responsive Interface

The interface includes:

* A clean package search experience
* Light, dark, and automatic themes
* Loading and error states
* Package comparison views
* Interactive package exploration

## Tech Stack

| Technology        | Purpose                           |
| ----------------- | --------------------------------- |
| React             | User interface                    |
| JavaScript        | Application logic                 |
| Vite              | Development and production builds |
| hyperDart         | Component integration             |
| Lucide React      | Interface icons                   |
| npm Registry API  | Package metadata                  |
| npm Downloads API | Package download statistics       |

## Project Structure

```text
package-insight-hyperdart/
├── src/
│   ├── frontend/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks.js
│   │   ├── index.jsx
│   │   ├── NewComponent.jsx
│   │   └── style.css
│   └── sandbox/
│       ├── index.css
│       └── main.jsx
├── scripts/
│   └── validate-publish.js
├── hyperdart.config.js
├── package.json
├── package-lock.json
├── searchData.json
├── resource.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

Install:

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/package-insight.git
```

Navigate to the project:

```bash
cd package-insight
```

Install dependencies:

```bash
npm install
```

### Run Locally

Start the development server:

```bash
npm start
```

Open the local URL displayed in the terminal.

### Production Build

```bash
npm run build
```

A successful build confirms that the project compiles. Functional testing is still required to verify search results and API behavior.

## hyperDart Integration

Package Insight uses the official hyperDart component structure.

The frontend entry point integrates the React component with hyperDart using `withHD()`.

The `hyperdart.config.js` file defines:

* Component name
* Trigger keywords
* Natural-language query patterns
* Client module configuration
* Supported display formats
* GitHub repository and demo video links

The component receives search information from the hyperDart environment and uses npm data sources to display relevant package insights.

## Data Sources

Package Insight retrieves package information using publicly available npm services:

**npm Registry API**

* Package descriptions
* Versions
* Dependencies
* Repository metadata
* Other available package information

**npm Downloads API**

* Package download statistics

Some information may be unavailable for particular packages. The interface is designed to communicate missing information rather than present unsupported values.

## Error Handling

The application includes handling for:

* Packages that cannot be found
* Failed API requests
* Missing package metadata
* Incomplete comparison results
* Loading states
* Unavailable alternative suggestions

## Testing

Recommended test queries:

| Query                             | Expected Behavior                  |
| --------------------------------- | ---------------------------------- |
| `npm express`                     | Display package details            |
| `latest version of react`         | Display latest version information |
| `compare react and vue`           | Display a two-package comparison   |
| `compare express, fastify, koa`   | Display a three-package comparison |
| `alternatives to moment`          | Display related npm packages       |
| `express 4 vs 5`                  | Display version comparison         |
| `npm package for date formatting` | Display package discovery results  |
| `nonexistent-package-123456`      | Display an appropriate error state |

Results depend on live API availability and the metadata provided by npm.

## Publishing

This project uses the official hyperDart development registry configuration.

Before publishing:

1. Verify that the project builds successfully.
2. Complete the GitHub and demo video fields in `hyperdart.config.js`.
3. Register the package through the hyperDart Partner Portal.
4. Configure registry authentication.
5. Run the official publishing validation.
6. Publish the package.

The project includes the official validation script:

```bash
npm run prepublishOnly
```

After successful validation and registry authentication:

```bash
npm publish
```

Publishing should not bypass the official validation process.

## Development Notes

This project was developed for a hackathon using the official hyperDart starter template.

The Package Insight frontend, package exploration logic, comparison interface, and npm data integration were incorporated into the hyperDart component structure.

**AI assistance disclosure:** AI-assisted tools were used during development for code generation, debugging, integration guidance, and documentation preparation. The submitted implementation should be reviewed and tested by the developer before final submission.

## Demo

**Video demonstration:** Coming soon.

## Future Improvements

Potential future enhancements include:

* Historical package download trends
* Dependency security insights
* Package maintenance indicators
* Expanded version compatibility analysis
* More detailed package recommendations

## License

No license has been specified for this project.# hyperdart-hackathon
