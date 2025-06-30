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
		//console.log(value);
		ds_struct_date = value;
	});
	$: id = 1000; //5764;

onMount(async function() {

	 // Beispiel: Testchart im pieDiv anzeigen
    if (pieDiv) {
        pieDiv.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        pieDiv.appendChild(canvas);
        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] },
            options: {
                responsive: false,
                maintainAspectRatio: false
            }
        });
    }

    customElements.whenDefined('data-quality').then(() => {
    const el = document.querySelector('data-quality');
    if (el && el.shadowRoot) {
        const style = document.createElement('style');
        style.textContent = css;
        el.shadowRoot.appendChild(style);
        console.log("ShadowRoot gefunden und Style hinzugefügt!");
    }else {
        console.log("Kein ShadowRoot gefunden!");
    }
});
    // showVis erst nach dem nächsten Tick aufrufen!
        await tick();
		showVis();
});
	// onMount(async () => {

	// 	await showVis();

	//  const host = this; // Das Custom Element selbst
    // if (host && host.shadowRoot) {
    //     const style = document.createElement('style');
    //     style.textContent = css;
    //     host.shadowRoot.appendChild(style);
    // }

		// structured_datasets.useLocalStorage();
		// url.useLocalStorage();
		// token.useLocalStorage();
		// api_version.useLocalStorage();

		// if (ds_struct.length == 0) {
		// 	refreshCache();
		// }
		// let headersList = {
		// 	Accept: 'application/json',
		// 	Authorization: 'Bearer ',
		// 	'Content-Type': 'application/json'
		// };
		// const version = await get_version(headersList, $url.toString());
		// api_version.set(version);



	//});

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
			//console.log('duplicates', dt.DataTable);
			duplicates = dt.DataTable;
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
	const showVis = async function () {

		 if (!boxplotDiv || !pieDiv || !barDiv || !scatterDiv || !barCatDiv) {
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
			console.log('statisticAPIdata', statisticAPIdata);	
			//const pieDiv = document.getElementById('pie');
			//console.log('pieDiv:', pieDiv, 'data:', d);
			try {
  				completeness_pie(d, pieDiv);
			} catch (e) {
  				console.error('Fehler beim Zeichnen des Charts:', e);
			}

			//const barDiv = document.getElementById('bar');
			completeness_bar(d, barDiv);

			// @ts-ignore
			duplicate_percent = show_duplicates(d);
			onTabChange();
			//console.log('doppelt', duplicate_percent);

			//const boxplotDiv = document.getElementById('boxplot');
// 			if (boxplotDiv) {
// 				boxplotDiv.innerHTML = '';
// 			}
// 			d.allVariablen.forEach((v) => {
				
//     		console.log('Variable:', v);
// 			 const boxDiv = document.createElement('div');
//                 boxDiv.id = 'boxplot_' + v.variableName; // ID setzen
//                 boxplotDiv.appendChild(boxDiv);
// 				//const boxplotDiv_temp = document.getElementById('boxplot');
// 				//boxplotDiv?.appendChild('beforeend', boxDiv);
// 				//const boxplotDiv = document.getElementById('boxplot_' + v.VariableName);
// 				boxplot(v, boxDiv);
//     // ...
// });
				
			

			//bubble_plot();

			//category_bar_plot();
		});
	}
	



function isIdColumn(variable) {
    if (!variable.uniqueValues || variable.uniqueValues.length === 0) return false;
    const allUnique = variable.uniqueValues.every(u => u.count === 1);
    return allUnique && variable.uniqueValues.length === variable.count;
}

function show_boxplots() {
    if (!boxplotDiv) {
        console.warn('boxplotDiv ist noch nicht gesetzt!');
        return;
    }
    boxplotDiv.innerHTML = '';
    const d = statisticAPIdata;
    if (!d || !d.allVariablen) return;

    d.allVariablen.forEach((v) => {
        // ID-Spalten überspringen
        if (isIdColumn(v)) {
            console.log('ID-Spalte erkannt und übersprungen:', v.variableName || v.VariableName);
            return;
        }
        // Numerische Variablen mit mindestens 2 verschiedenen Werten
        const type = v.DataTypeSystemType || v.dataTypeSystemType;
        const allowedTypes = ['Double', 'Int32', 'Int64', 'Decimal'];
        if (
            allowedTypes.includes(type) &&
            v.uniqueValues &&
            v.uniqueValues.length > 1
        ) {
            const varName = v.variableName || v.VariableName || 'Variable';
            const boxDiv = document.createElement('div');
            boxDiv.style.width = "400px";
            boxDiv.style.height = "300px";
            boxDiv.id = 'boxplot_' + varName;
            boxplotDiv.appendChild(boxDiv);

            // Optional: Titel und Legende setzen
            boxplot(
                {
                    ...v,
                    label: varName,
                    legend: varName
                },
                boxDiv
            );
        }
    });
}
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
		 console.log("Bubble-Check:", v);
        // ID-Spalten überspringen
        //if (isIdColumn(v)) return;
        // Nur numerische Variablen mit mindestens 2 verschiedenen Werten plotten
        const allowedTypes = ['Double', 'Int32', 'Int64', 'Decimal'];
        if (
            allowedTypes.includes(v.dataTypeSystemType) &&
            v.uniqueValues &&
            v.uniqueValues.length > 1
        ) {
            const scatterBox = document.createElement('div');
            scatterBox.style.width = "400px";
            scatterBox.style.height = "300px";
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
		barCatBox.style.width = "400px";
		barCatBox.style.height = "300px";
        barCatDiv.appendChild(barCatBox);
		console.log("barCatDiv data", v);

			//const barDiv_temp = document.getElementById('bar_cat');
			//barDiv?.appendChild('beforeend', barCatBox);
			//const barDiv = document.getElementById('bar_cat_' + v.VariableName);

			if (v.dataTypeSystemType == 'String') {
				bar_cat(v, barCatBox);
				count_text++;
			}

			if (v.dataTypeSystemType == 'DateTime') {
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
    console.log("Tab gewechselt:", { tabsBasic, tabsMissingValues });
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
        } else if (tabsBasic === 3) {
            // Date-Tab: Kein Chart, nur Text
            console.log("Date-Tab aktiv, keine Visualisierung.");
        }
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
                completeness_bar(statisticAPIdata, barDiv);
            }
        }
        // Tab 1 (Table) braucht keine Chart-Visualisierung, nur Tabelle
    }
	  }, 0);
}

</script>


<div class="min-h-screen bg-background text-primary font-sans p-6">
	<div class="max-w-3xl mx-auto">
	<h2 class="pt-4 pb-4 text-secondary-700 dark:text-white">Data Quality</h2>
	<!-- <div class="flex flex-row">
		<div>
			<label class="input-label w-96" for="dq">
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-md">
					<select
						class="select variant-form-material w-40"
						id="dq"
						bind:value={id}
						disabled={loading}
					>
						{#each ds_struct as dataset, i}
							<option class="bg-surface-500" value={dataset}>{dataset}</option>
						{/each}
					</select>
					<input
						class="w-10"
						type="text"
						id="name"
						bind:value={id}
						disabled={loading}
						on:keypress={onKeyPress}
					/>
				</div>
			</label>
		</div>
		<div>
			<button class="btn bg-primary-500 rounded-md w-50 pl-20" on:click={showVis} disabled={loading}
				>Show DQ</button
			>
		</div>
	</div> -->
	<!-- <div>
		{#if ds_struct_date}<span class="italic">Cache date: {ds_struct_date}. </span><span
				on:keypress={refreshCache}
				on:click={refreshCache}
				title="Refresh cache"><i class="fa-solid fa-rotate" /></span
			>{/if}
	</div> -->

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
	<h3 class="pt-4 pb-4 text-secondary-700 dark:text-white">1. Duplicate Check</h3>
	{#if duplicate_percent == 0}
		<aside class="alert variant-ghost-success w-80">
			<i class="fa-solid fa-circle-check text-2xl" />
			<h3 class="alert-message">Duplicates: 0%</h3>
		</aside>
	{/if}
	{#if duplicate_percent <= 10 && duplicate_percent > 0}
		<aside class="alert variant-ghost-warning w-80">
			<i class="fa-solid fa-circle-exclamation text-2xl" />
			<h3 class="alert-message">Duplicates: {duplicate_percent.toFixed(4)}%</h3>
		</aside>
	{/if}
	{#if duplicate_percent > 10}
		<aside class="alert variant-ghost-error w-80">
			<i class="fa-solid fa-circle-xmark text-2xl" />
			<h3 class="alert-message">Duplicates: {duplicate_percent.toFixed(4)}%</h3>
		</aside>
	{/if}
	<div id="duplicates" bind:this={duplicatesDiv}></div>
	<div id="dupTable" bind:this={dupTableDiv}></div>
	<h3 class="pt-4 pb-4 text-secondary-700 dark:text-white">2. Missing Value Check</h3>

	<TabGroup bind:group={tabsMissingValues}>
		<Tab bind:group={tabsMissingValues} name="Graph" value={0}>Graph</Tab>
		<Tab bind:group={tabsMissingValues} name="Table" value={1}>Table</Tab>
		<svelte:fragment slot="panel">
			<div hidden={tabsMissingValues !== 0}>
				<div class="dashbord">
					<div class="vollstContainer">
						<div bind:this={pieDiv}></div>
                        <div bind:this={barDiv}></div>
                        <div bind:this={affectedVarDiv}></div>
					</div>
				</div>
			</div>
			<div hidden={tabsMissingValues !== 1}>
				{#if affectedVariablen && affectedVariablen.length > 0}
					<table>
						<tr><th>Variable Name</th><th>Unit</th><th>Count NA</th><th>Count Null</th></tr>
						{#each affectedVariablen as variable}
							<tr
								><td>{variable.variableName}</td><td>{variable.Unit}</td><td>{variable.NA}</td><td
									>{variable.NULL}</td
								></tr
							>
						{/each}
					</table>
				{/if}
			</div>
		</svelte:fragment>
	</TabGroup>
	<h3 class="pt-4 pb-4 text-secondary-700 dark:text-white">
		3. Distribution & Count of Unique Values
	</h3>

	<TabGroup bind:group={tabsBasic} >
		<!-- Tabs -->
		<Tab bind:group={tabsBasic} name="Bubble Plot (number)" value={0}
			>Bubble Plot (#)<sup class="badge variant-filled-primary">{count_number}</sup></Tab
		>
		<Tab bind:group={tabsBasic} name="Box-Whisker-Plot (number)" value={1}
			>Box-Whisker-Plot (#)<sup class="badge variant-filled-primary">{count_number}</sup></Tab
		>
		<Tab bind:group={tabsBasic} name="Bar Plot (text)" value={2}
			>Bar Plot (text)<sup class="badge variant-filled-primary">{count_text}</sup></Tab
		>
		<Tab bind:group={tabsBasic} name="Date" value={3}
			>Date<sup class="badge variant-filled-primary">{count_date}</sup></Tab
		>
		<!-- Panel -->
		<svelte:fragment slot="panel">
			<div hidden={tabsBasic !== 0} id="scatter" bind:this={scatterDiv}></div>
			<div hidden={tabsBasic !== 1} id="boxplot" bind:this={boxplotDiv} ></div>
			<div hidden={tabsBasic !== 2} id="bar_cat" bind:this={barCatDiv} > </div>
			<div hidden={tabsBasic !== 3}>
				<p class="pt-2">Sorry, no visualization available.</p>
			</div>
		</svelte:fragment>
	</TabGroup>
	</div>
</div>


<style>
	.dashbord {
		display: flex;
		flex-direction: column;
	}

	.vollstContainer {
		display: flex;
	}

	#pie {
		max-height: 40rem;
		width: 20rem;
		min-width: 20rem;
		padding: 1rem;
		margin: 1rem;
		overflow: auto;
	}

	#bar {
		max-height: 20rem;
		width: 50rem;
		min-width: 40rem;
		padding: 1rem;
		margin: 1rem;
		overflow: auto;
	}

	#boxplot {
		width: 50rem;
		padding: 1rem;
		margin: 1rem;
		overflow: auto;
	}

	#scatter {
		width: 50rem;
	}

	#affectedVar {
		max-height: 20rem;
		overflow: auto;
		min-width: max-content;
	}

	#dupTable {
		width: 40rem;
		max-height: 20rem;
		margin: 0.4rem;
		overflow: auto;
	}

	#bar_cat {
		max-height: 20rem;
		width: 50rem;
		min-width: 40rem;
		padding: 1rem;
		margin: 1rem;
		overflow: auto;
	}

	:global(#dupTable > table) {
		width: 100%;
	}

	:global(table, th, td) {
		border: 1px solid black;
	}

	#pie, #bar, #boxplot, #scatter, #bar_cat {
    min-height: 300px;
    min-width: 300px;
}
</style>
