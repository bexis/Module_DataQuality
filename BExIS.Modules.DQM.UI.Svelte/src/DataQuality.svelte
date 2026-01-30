<svelte:options tag="data-quality"/>

<script>
	import css from './tailwind.generated.css?raw';                      
	import { tick } from 'svelte';
	import { initializeStores } from '@skeletonlabs/skeleton';
	import { Chart } from 'chart.js';
	initializeStores(); // Manuell starten
	import { url, api_version, structured_datasets } from './store/store';
	import { onMount } from 'svelte';
	import { ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import {
		show_dublicates as show_duplicates,
		show_unique_value_distribution,
		boxplot,
		completeness_pie,
		completeness_bar,
		bar_cat
	} from './draw_charts';
	import { getData } from './services/DataCaller';
	import { structured_datasets_date } from './store/store';

	Chart.defaults.font.family = 'inherit';
	Chart.defaults.color = 'inherit';

	export let datasetid;
	export let version;
	
	

    let pieDiv, barDiv,scatterDiv_temp, boxplotDiv, scatterDiv, duplicatesDiv, dupTableDiv, affectedVarDiv, barCatDiv, div;


	let loading = false;
	$: props = { value: 50, max: 100, step: 10 };

	let error = false;

	/**
	 * @type {any[] | string}
	 */
	let ds_struct;
	structured_datasets.subscribe((/** @type {string | any[]} */ value) => {
		ds_struct = value;
		//console.log(ds_struct);
	});
	/**
	 * @type {string | any[]}
	 */
	let ds_struct_date;
	structured_datasets_date.subscribe((/** @type {string | any[]} */ value) => {

		ds_struct_date = value;
	});
	// let testDatasetId = '26487';
	// console.log("datasetId123d:", testDatasetId);
	$: id = datasetid;


onMount(async function() {

    customElements.whenDefined('data-quality').then(() => {
    const el = document.querySelector('data-quality');
    if (el && el.shadowRoot) {
        const style = document.createElement('style');
        style.textContent = css;
        el.shadowRoot.appendChild(style);
        
    }else {
        console.log("Kein ShadowRoot gefunden!");
    }
});
        await tick();
		showVis();
});
	
	async function refreshCache() {
		loading = true;
		structured_datasets.set([]);
		structured_datasets_date.set('');
		// const result = await fetch_datasets($url + endpoint_structured_datasets);
		// structured_datasets.set(result);
		structured_datasets_date.set(new Date().toDateString());
		loading = false;
	}

	let endpoint_data_statistics = '/api/DataStatistic';
	let endpoint_data_quality = '/api/DataQuality/';
	let endpoint_structured_datasets = '/api/DataStatistic';

	//this is the id of a dataset
	/**
	 * @type {any}
	 */
	
	let showId = 0;
	/**
	 * @type {{ count: number; countRows: number; countColumns: number; countData: number; countMv: number; countNull: number; missingValues: any[]; affectedVariablen: any[]; allVariablen: any[]; duplicates: any[]; }}
	 */
	let statisticAPIdata;

	//affectedVariablen is a list of all variables (columns) affected by completeness
	/**
	 * @type {any[]}
	 */
	$: affectedVariablen = [];

	//-------------------------------------------------------------------------
	// Create base object
	//-------------------------------------------------------------------------
	const getDQ = async function (/** @type {string | number} */ id) {
		
		//countAll represents the number of all cells in a table
		let countAll = 0;
		//countRows represents the number of all rows in a table
		let countRows = 0;
		//countColumns represents the number of all columns in a table
		let countColumns = 0;
		//countMv represents the number of all Missing Values in a table
		let countMv = 0;
		//countNull represents the number of all empty cells in a table
		let countNull = 0;
		//duplicates is a list of duplicates in a table
		/**
		 * @type {any[]}
		 */
		let duplicates = [];
		//allVariablen is a list of all variables (columns) in a table
		/**
		 * @type {any[]}
		 */
		let allVariablen = [];

		//missingVAlues is a list of all type of Missing Values
		/**
		 * @type {any[]}
		 */
		const missingValues = [];

		//get the variables using an api call and prepare them for the visualization
		loading = true;
		error = false;
		await getData(endpoint_data_statistics, id).then(
			async (variables) => {
				if (variables == false) {
					loading = false;
					error = true;
				}
				allVariablen = variables;
				countRows = parseInt(variables[0].count);
				countColumns = variables.length;
				countAll = countRows * countColumns;
				// @ts-ignore
				showId = id;
				await variables.forEach(
					(
						/** @type {{ [x: string]: any; missingValues: any; uniqueValues: any; NULL: any; }} */ variable
					) => {
						const mvs = variable.missingValues;
						const uvs = variable.uniqueValues;
						//count empty cells in this variable
						const nulls = (() => {
							const obj = uvs.find(
								(/** @type {{ var: string | null; }} */ x) => x.var === 'NULL' || x.var === null
							);
							return obj ? obj.count : 0;
						})();
						variable.NULL = nulls;
						if (nulls) {
							countNull += nulls;
							if (affectedVariablen.indexOf(variable) === -1) {
								affectedVariablen.push(variable);
							}
						}

						//get all missing Values in this variable, count them and add this number to countMv
						mvs.forEach((/** @type {{ displayName: any; placeholder: any; }} */ mv) => {
							const name = mv.displayName;
							const value = mv.placeholder;
							const count = (() => {
								const obj = uvs.find(
									(/** @type {{ var: number; }} */ x) => x.var === Number(value)
								);
								return obj ? obj.count : 0;
							})();
							if (count) {
								countMv += count;
								variable[name] = count;
								if (missingValues.indexOf(name) === -1) {
									missingValues.push(name);
								}
								if (affectedVariablen.indexOf(variable) === -1) {
									console.log("affectedVariablen push:", variable);
									affectedVariablen.push(variable);
								}
							}
						});
					}
				);
			}
		);

		//get all duplicates using api call
		await getData(endpoint_data_quality, id).then((dt) => {
			duplicates = dt.dataTable;
		});
		loading = false;
		//set and return the result for the visualization
		const result = {
			count: countAll,
			countRows: countRows,
			countColumns: countColumns,
			countData: countAll - countMv - countNull,
			countMv: countMv,
			countNull: countNull,
			missingValues: missingValues,
			affectedVariablen: affectedVariablen,
			allVariablen: allVariablen,
			duplicates: duplicates
		};
		return result;
	};

	//-------------------------------------------------------------------------
	// Create visualizations
	//-------------------------------------------------------------------------
	let duplicate_percent = -1;
	async function showVis() {
    if (!pieDiv || !barDiv || !scatterDiv || !barCatDiv) {
        console.warn('Ein oder mehrere Chart-Container sind noch nicht gesetzt!');
        return;
    }
    // remove existing graphs
    remove_content('scatter');
    remove_content('pie');
    remove_content('bar');
    remove_content('duplicates');
    remove_content('boxplot');
    remove_content('dupTable');
    remove_content('affectedVar');
    remove_content('bar_cat');

    // reset affected variables to ensure it is always filled new
    affectedVariablen = [];

    // create charts
    getDQ(id).then((d) => {
        statisticAPIdata = d;
        try {
            completeness_pie(d, pieDiv);
        } catch (e) { /* Fehlerbehandlung */ }

        // completeness_bar: pass affectedVarDiv (shadow DOM kompatibel)
        completeness_bar(d, barDiv, affectedVarDiv);
        duplicate_percent = show_duplicates(d, dupTableDiv, duplicatesDiv);
        onTabChange();
    });
	}
	



function isIdColumn(variable) {
    if (!variable.uniqueValues || variable.uniqueValues.length === 0) return false;
    const allUnique = variable.uniqueValues.every(u => u.count === 1);
    return allUnique && variable.uniqueValues.length === variable.count;
}

// function show_boxplots() {
//     if (!boxplotDiv) {
//         console.warn('boxplotDiv ist noch nicht gesetzt!');
//         return;
//     }
//     boxplotDiv.innerHTML = '';
//     const d = statisticAPIdata;
//     if (!d || !d.allVariablen) return;

//     d.allVariablen.forEach((v) => {
//         // ID-Spalten überspringen
//         if (isIdColumn(v)) {
//             console.log('ID-Spalte erkannt und übersprungen:', v.variableName || v.VariableName);
//             return;
//         }
//         // Numerische Variablen mit mindestens 2 verschiedenen Werten
//         const type = v.DataTypeSystemType || v.dataTypeSystemType;
//         const allowedTypes = ['Double', 'Int32', 'Int64', 'Decimal'];
//         if (
//             allowedTypes.includes(type) &&
//             v.uniqueValues &&
//             v.uniqueValues.length > 1
//         ) {
//             const varName = v.variableName || v.VariableName || 'Variable';
//             const boxDiv = document.createElement('div');
//             boxDiv.style.width = "fit-content";
//             boxDiv.style.height = "fit-content";
//             boxDiv.id = 'boxplot_' + varName;
//             boxplotDiv.appendChild(boxDiv);

//             // Optional: Titel und Legende setzen
//             boxplot(
//                 {
//                     ...v,
//                     label: varName,
//                     legend: varName
//                 },
//                 boxDiv
//             );
//         }
//     });
//}
	/**
	 * @type {number}
	 */
	let count_number = 0;
	function bubble_plot() {
		//console.log("statisticAPIdata", statisticAPIdata);
		const d = statisticAPIdata;
		//console.log("Data bubble:",d);
		//const scatterDiv_temp = document.getElementById('scatter');
		// @ts-ignore
		 if (scatterDiv) {
        scatterDiv.innerHTML = '';
    }
		 count_number = 0;
    d.allVariablen.forEach((v) => {
        // ID-Spalten überspringen
        //if (isIdColumn(v)) return;
        const allowedTypes = ['Double', 'Int32', 'Int64', 'Decimal'];
        if (
            allowedTypes.includes(v.dataTypeSystemType) &&
            v.uniqueValues &&
            v.uniqueValues.length > 1
        ) {
            const scatterBox = document.createElement('div');
            scatterBox.style.width = "fit-content";
            scatterBox.style.height = "fit-content";
            scatterBox.id = 'scatter_' + (v.variableName || v.VariableName);
            scatterDiv.appendChild(scatterBox);
            show_unique_value_distribution(d, v, scatterBox);
            count_number++;
        }
    });
	}

	let count_text = 0;
	let count_date = 0;
	function category_bar_plot() {
		  if (!barCatDiv) {
        console.warn('barCatDiv ist noch nicht gesetzt!');
        return;
    }
		const d = statisticAPIdata;
		//const barDiv_temp = document.getElementById('bar_cat');

		if (barDiv) {
			barDiv.innerHTML = '';
		}
		count_text = 0;
		d.allVariablen.forEach((v) => {
       const barCatBox = document.createElement('div');
        barCatBox.id = 'bar_cat_' + v.variableName;
		barCatBox.style.width = "fit-content";
		barCatBox.style.height = "fit-content";
        barCatDiv.appendChild(barCatBox);
		// console.log("barCatDiv data", v);

			//const barDiv_temp = document.getElementById('bar_cat');
			//barDiv?.appendChild('beforeend', barCatBox);
			//const barDiv = document.getElementById('bar_cat_' + v.VariableName);

			if (v.dataTypeSystemType == 'String') {
				bar_cat(v, barCatBox);
				count_text++;
			}

			if (v.dataTypeSystemType == 'DateTime') {
				console.log("DateTime variable found:", v);
				bar_cat(v, barCatBox);
				count_date++;
			}
		});
	}
	/**
	 * @param {string} element
	 */
	function remove_content(element) {
    // Leert gezielt das jeweilige Chart-Div
    if (element === 'pie' && pieDiv) pieDiv.innerHTML = '';
    else if (element === 'bar' && barDiv) barDiv.innerHTML = '';
    else if (element === 'scatter' && scatterDiv) scatterDiv.innerHTML = '';
    else if (element === 'boxplot' && boxplotDiv) boxplotDiv.innerHTML = '';
    else if (element === 'dupTable' && dupTableDiv) dupTableDiv.innerHTML = '';
    else if (element === 'duplicates' && duplicatesDiv) duplicatesDiv.innerHTML = '';
    else if (element === 'affectedVar' && affectedVarDiv) affectedVarDiv.innerHTML = '';
    else if (element === 'bar_cat' && barCatDiv) barCatDiv.innerHTML = '';
}

	const onKeyPress = (/** @type {{ charCode: number; }} */ e) => {
		if (e.charCode === 13) showVis();
	};

	let tabsBasic = 0;
	let tabsMissingValues = 0;

	 
  $: if (statisticAPIdata && (tabsBasic !== undefined || tabsMissingValues !== undefined)) {
    onTabChange();
	}

	async function onTabChange() {
    await tick();

       setTimeout(() => {
    if (typeof tabsBasic !== 'undefined') {
        // Alle Chart-Divs leeren
        if (scatterDiv) scatterDiv.innerHTML = '';
        if (boxplotDiv) boxplotDiv.innerHTML = '';
        if (barCatDiv) barCatDiv.innerHTML = '';

        if (tabsBasic === 0) {
            bubble_plot();
        } else if (tabsBasic === 1) {
            show_boxplots();
        } else if (tabsBasic === 2) {
            category_bar_plot();
        } 
		//else if (tabsBasic === 3) {
        //     // Date-Tab: Kein Chart, nur Text
        //     console.log("Date-Tab aktiv, keine Visualisierung.");
        // }
    }

    // Charts für Missing Value Check (tabsMissingValues)
    if (typeof tabsMissingValues !== 'undefined') {
        if (pieDiv) pieDiv.innerHTML = '';
        if (barDiv) barDiv.innerHTML = '';
        if (affectedVarDiv) affectedVarDiv.innerHTML = '';

        if (tabsMissingValues === 0) {
            // Pie und Bar Chart für Missing Values
            if (statisticAPIdata) {
                completeness_pie(statisticAPIdata, pieDiv);
                // WICHTIG: affectedVarDiv mitgeben, sonst erscheint die Tabelle nicht
                completeness_bar(statisticAPIdata, barDiv, affectedVarDiv);
            }
        }
        // Tab 1 (Table) braucht keine Chart-Visualisierung, nur Tabelle
    }
	  }, 0);
}

</script>


<div class="min-h-screen bg-background text-primary font-sans p-6 text-lg md:text-xl">
	<div class="mx-auto">
	
	{#if error == true}
		<p class="text-red-500 pt-2">An error occurred.</p>
		<blockquote>
			Dataset does not contain structured primary data or the dataset is not public and you are not
			logged in.
		</blockquote>
	{/if}
	{#if loading == true}
		<div class="card variant-glass p-4 grid grid-cols-2 gap-4 text-center">
			<div class="w-full max-w-[120px] mx-auto space-y-4">
				<p>Loading</p>
				<ProgressRadial>{props.value}%</ProgressRadial>
			</div>
		</div>
	{:else}{/if}
	<h2 class="pt-4 pb-4 md:text-5xl text-secondary-700 dark:text-white">1. Duplicate Check</h2>
	<div class="duplicate-card {duplicate_percent === 0 ? 'duplicate-success' : duplicate_percent <= 10 ? 'duplicate-warning' : 'duplicate-error'}">
    {#if duplicate_percent == 0}
        <aside class="alert variant-ghost-success w-96">
            <i class="fa-solid fa-circle-check text-2xl" />
            <h3 class="alert-message">Duplicates: 0%</h3>
        </aside>
    {/if}
    {#if duplicate_percent <= 10 && duplicate_percent > 0}
        <aside class="alert variant-ghost-warning w-96">
            <i class="fa-solid fa-circle-exclamation text-2xl" />
            <h3 class="alert-message">Duplicates: {duplicate_percent.toFixed(4)}%</h3>
        </aside>
    {/if}
    {#if duplicate_percent > 10}
        <aside class="alert variant-ghost-error w-96">
            <i class="fa-solid fa-circle-xmark text-2xl" />
            <h3 class="alert-message">Duplicates: {duplicate_percent.toFixed(4)}%</h3>
        </aside>
    {/if}
</div>
<div id="duplicates" bind:this={duplicatesDiv}></div>
<div id="dupTable" bind:this={dupTableDiv}></div>

    <!-- 2. Missing Value Check -->
    <h2 class="pt-4 pb-4 md:text-5xl text-secondary-700 dark:text-white">2. Missing Value Check</h2>
    <TabGroup bind:group={tabsMissingValues}>
        <Tab bind:group={tabsMissingValues} name="Graph" value={0}>Graph</Tab>
        <Tab bind:group={tabsMissingValues} name="Table" value={1}>Table</Tab>
        <svelte:fragment slot="panel">
            <div hidden={tabsMissingValues !== 0}>
                <div class="dashbord">
                    <div class="vollstContainer">
                        <div id="pie" bind:this={pieDiv}></div>
                        <div id="bar" bind:this={barDiv}></div>
                        <div id="affectedVar" bind:this={affectedVarDiv}></div>
                    </div>
                </div>
            </div>
            <div hidden={tabsMissingValues !== 1}>
                {#if affectedVariablen && affectedVariablen.length > 0}
                    <table>
                        <tr><th>Variable Name</th><th>Unit</th><th>Count NA</th><th>Count Null</th></tr>
                        {#each affectedVariablen as variable}
                            <tr>
                                <td>{variable.variableName}</td>
                                <td>{variable.unit || 'none'}</td>
                                <td>{variable.NA ?? 0}</td>
                                <td>{variable.NULL ?? 0}</td>
                            </tr>
                        {/each}
                    </table>
                {/if}
            </div>
        </svelte:fragment>
    </TabGroup>
	<h2 class="pt-4 pb-4 text-secondary-700 dark:text-white">
		3. Distribution & Count of Unique Values
	</h2>

	<TabGroup bind:group={tabsBasic} >
		<!-- Tabs -->
		<Tab bind:group={tabsBasic} name="Bubble Plot (number)" value={0}
			>Bubble Plot (#)<sup class="badge variant-filled-primary">{count_number}</sup></Tab
		>
		<!-- <Tab bind:group={tabsBasic} name="Box-Whisker-Plot (number)" value={1}
			>Box-Whisker-Plot (#)<sup class="badge variant-filled-primary">{count_number}</sup></Tab
		> -->
		<Tab bind:group={tabsBasic} name="Bar Chart" value={2}
			>Bar Chart<sup class="badge variant-filled-primary">{count_text}</sup></Tab
		>
		<!-- <Tab bind:group={tabsBasic} name="Date" value={3}
			>Date<sup class="badge variant-filled-primary">{count_date}</sup></Tab
		> -->
		<!-- Panel -->
		<svelte:fragment slot="panel">
			<div hidden={tabsBasic !== 0} id="scatter" bind:this={scatterDiv}></div>
			<!-- <div hidden={tabsBasic !== 1} id="boxplot" bind:this={boxplotDiv} ></div> -->
			<div hidden={tabsBasic !== 2} id="bar_cat" bind:this={barCatDiv} > </div>
			<!-- <div hidden={tabsBasic !== 3}>
				<p class="pt-2">Sorry, no visualization available.</p>
			</div> -->
		</svelte:fragment>
	</TabGroup>
	</div>
</div>


<style>
h3 {
    font-size: 1.4rem;
    /* font-weight: 500; */
    margin-bottom: 1rem;
}

h2 {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1rem;
}

p, td, th {
    line-height: 1.6;
}

.dashbord {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-start;
}

.vollstContainer {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
}

#pie {
    min-width: 400px;
    padding: 1rem;
    margin: 1rem;
}

#bar {
    min-width: 400px;
    padding: 1rem;
    margin: 1rem;
    overflow: visible;
}

#affectedVar {
    margin-left: 2rem;
    max-height: 25rem;
    overflow-y: auto;     /* Nur vertikales Scrollen */
    overflow-x: hidden;   /* Kein horizontales Scrollen */
    min-width: 20rem;
    position: relative;   /* Für sticky header */
}

#affectedVar table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 0.875rem;
}

#affectedVar table thead {
    position: sticky;
    top: 0;
    z-index: 10;
}

#affectedVar table th {
    background-color: #bee1da;
    color: #2c3e50;
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #95c9be;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
}

#affectedVar table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #dee2e6;
    color: #212529;
}

/* Betroffene Variablen (ROT) */
#affectedVar table tr.affected {
    background-color: #ffbfbf !important;
    border-left: 3px solid #dc3545;
}

#affectedVar table tr.affected:hover {
    background-color: #ff9999 !important;
}

/* Nicht betroffene Variablen */
#affectedVar table tbody tr:hover {
    background-color: #e3f3f1;
    cursor: pointer;
}

#affectedVar table tbody tr:nth-child(even) {
    background-color: #f8fafa;
}

#affectedVar table tbody tr:nth-child(odd) {
    background-color: #ffffff;
}

#dupTable {
    max-height: 30rem;
    overflow: auto;
    margin-top: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

#dupTable table,
#affectedVar table,
table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 1.5rem;
}

#dupTable table th,
#affectedVar table th,
table th {
    background-color: #bee1da;
    color: #2c3e50;
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #95c9be;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
}

#dupTable table td,
#affectedVar table td,
table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #dee2e6;
    color: #212529;
    white-space: nowrap;
}

#dupTable table tbody tr:hover,
#affectedVar table tbody tr:hover,
table tbody tr:hover {
    background-color: #e3f3f1;
    cursor: pointer;
}

#dupTable table tbody tr:nth-child(even),
#affectedVar table tbody tr:nth-child(even),
table tbody tr:nth-child(even) {
    background-color: #f8fafa;
}

/* Highlighted row (für affected variables) */
#affectedVar table tr[style*="background-color: #ff000050"],
#affectedVar table tr[style*="background-color: rgb(255, 0, 0)"] {
    background-color: #fff5f5 !important;
    border-left: 3px solid #dc3545;
}

#affectedVar table tr[style*="background-color: #ff000050"]:hover,
#affectedVar table tr[style*="background-color: rgb(255, 0, 0)"]:hover {
    background-color: #ffe3e3 !important;
}

/* Scrollbar Styling */
#dupTable,
#affectedVar {
    scrollbar-width: thin;
    scrollbar-color: #95c9be #f7fafc;
}

#dupTable::-webkit-scrollbar,
#affectedVar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

#dupTable::-webkit-scrollbar-track,
#affectedVar::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 4px;
}

#dupTable::-webkit-scrollbar-thumb,
#affectedVar::-webkit-scrollbar-thumb {
    background-color: #95c9be;
    border-radius: 4px;
    border: 2px solid #f7fafc;
}

#dupTable::-webkit-scrollbar-thumb:hover,
#affectedVar::-webkit-scrollbar-thumb:hover {
    background-color: #7ab5a8;
}

#dupTable::-webkit-scrollbar-corner {
    background-color: #f7fafc;
}

.duplicate-card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(17, 24, 39, 0.05);
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    transition: background-color 0.3s ease;
}

.duplicate-card.duplicate-success {
    background-color: #daf0ec; 
    border-color: #c3e6cb;
}

.duplicate-card.duplicate-warning {
    background-color: #ffe5bf; 
    border-color: #ffeeba;
}

.duplicate-card.duplicate-error {
    background-color: #ffe5bf; 
    border-color: #f5c6cb;
}
</style>
