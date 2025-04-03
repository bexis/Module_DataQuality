<script lang="ts">
	import { writable } from 'svelte/store';
	import { Page, Spinner } from '@bexis2/bexis2-core-ui';
	import { Table } from '@bexis2/bexis2-core-ui';
	import type { TableConfig } from '@bexis2/bexis2-core-ui';
	import { onMount,  } from 'svelte';
	// import { setApiConfig, host, username, password}  from '@bexis2/bexis2-core-ui';
	import { getData }  from '../../services/DataCaller';
	import { getGenerationDate }  from '../../services/DataCaller';
	
	let data : any;
	const dataStore = writable<any[]>([]);
	let generationDate;
	
	
	$: generationDate = generationDate ?? "";

	$: dataStore.set(data ?? []);
	

	const tableConfig: TableConfig<any> = {						
		id: 'datasetoverview',						
		data: dataStore,
		exportable: true,
		resizable: 'both',
		columns: {
			title: {
				minWidth: 500
			},

			"#VIP Grld":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
				}
				}
			},
				"#VIP Forest":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
				}
				}},
				"#MIP Grld":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}},
				"#MIP Forest":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}},
				"#EP Grld":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}},
				"#EP Forest":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}
			},
			"#GP Grld":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}
			},
			"#GP Forest":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}
			},
			"#JointExp Grld":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}
			},
			"#JointExp Forest":{
				instructions: {
					toStringFn: (value: number) => {
    			return value;
}
				}
			}

	}};

	
	onMount(async () => {

		// setApiConfig('https://localhost:44345','epetzold','2021.B2.Go$On');
	
		data = await getData();
		data = JSON.parse(data);
		console.log(data);

		generationDate =  await getGenerationDate();
		

	})

	
</script>

<Page title="Dataset Overview">
	
<div>
	<table style="width:500px;">
		<tr>
			<td>Overview generated: {generationDate} <br /><br></td>
		</tr>
		<tr>
			<td>
				<fieldset name="Legend" style="width:500px; border: 1px solid #1F497D;">
					<legend  style="background: #1F497D; 
				color: #fff;
				padding: 5px 10px ;
				font-size: 14px;
				border-radius: 5px;
				box-shadow: 0 0 0 5px #ddd;
				margin-left: 10px;">Legend</legend>
				<p class="p-5">
					-1 = no primary data<br />
					-2 = no plot column in data structure<br />
					-3 = no information about the plot number in the metadata</p>
				</fieldset>
			</td>
			<td>
				
		</tr>
	</table>
</div>
<div class="w-[1500px] mt-10">

		<Table config={tableConfig} />

</div>

</Page>