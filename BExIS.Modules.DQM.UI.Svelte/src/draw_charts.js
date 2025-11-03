/*
	Everything you need to install and use Chart.js can be found here:
	https://chartjs-plugin-datalabels.netlify.app
	https://www.chartjs.org

	Boxplot-Github:
	https://github.com/sgratzl/chartjs-chart-boxplot
	*/
import {
	Chart,
	LinearScale,
	CategoryScale,
	PieController,
	BubbleController,
	BarController,
	LogarithmicScale,
	ArcElement,
	PointElement,
	BarElement,
	Decimation,
	Filler,
	Legend,
	Title,
	Tooltip
} from 'chart.js';

import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';

// @ts-ignore
Chart.defaults.color = 'white';

// @ts-ignore
Chart.register(
	BoxPlotController,
	BoxAndWiskers,
	LinearScale,
	CategoryScale,
	PieController,
	BubbleController,
	BarController,
	LogarithmicScale,
	ArcElement,
	PointElement,
	BarElement,
	Decimation,
	Filler,
	Legend,
	Title,
	Tooltip
);
Chart.defaults.font.size = 24;       // ggf. 20/22, wenn du noch größer willst
Chart.defaults.font.family = 'Arial, sans-serif';

/**
 * @param {{ count: any; countRows?: number; countColumns?: number; countData: any; countMv: any; countNull: any; missingValues?: any[]; affectedVariablen?: any[]; allVariablen?: any[]; duplicates?: any[]; }} d
 * @param {HTMLElement | null} pieDiv
 */

export function prepareCanvas(canvas, width = 800, height = 500) {
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width * ratio;
  canvas.height = height * ratio;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return ctx;
}

export function completeness_pie(d, pieDiv) {
	const pieCanvas = document.createElement('canvas');
	pieCanvas.width = 700;               // Bitmap
	pieCanvas.height = 450;
	pieCanvas.style.width = '700px';     // CSS exakt gleich -> kein Blur
	pieCanvas.style.height = '450px';
	/**
	 * @type {string[]}
	 */
	let labels = ['Data'];
	/**
	 * @type {any[]}
	 */
	let data = [d.countData];
	let backgroundColor = ['rgb(50,205,50)'];
	let hoverBackgroundColor = ['rgba(50,205,50,0.8)'];

	if (d.countMv > 0) {
		labels.push('Missing Values');
		data.push(d.countMv);
		backgroundColor.push('rgb(255,165,0)');
		hoverBackgroundColor.push('rgba(255,165,0,0.8)');
	}
	if (d.countNull > 0) {
		labels.push('NULL');
		data.push(d.countNull);
		backgroundColor.push('rgb(255,0,0)');
		hoverBackgroundColor.push('rgba(255,0,0,0.8)');
	}
	const ctx = prepareCanvas(pieCanvas, 700, 450);

	new Chart(ctx, {
		type: 'pie',
		data: {
			//names of the legends in the pie
			labels: labels,
			datasets: [
				{
					//set the data for the pie
					data: data,
					backgroundColor: backgroundColor,
					hoverBackgroundColor: hoverBackgroundColor
				}
			]
		},
		//options of the pie
		options: {
			borderWidth: 1,
			responsive: false,
			plugins: {
				legend: {
    			labels: { font: { size: 20 } }
				},
				datalabels: {
					//set the percentage in the pie
					formatter: (/** @type {number} */ value) => {
						return ((value * 100) / d.count).toFixed(2) + '%';
					},
					color: '#fff',
					font: {
						size: 18
					},
					//hide precentage in the pie, if is 0%
					display: [d.countData > 0, d.countMv > 0, d.countNull > 0],
					align: 'start',
					//prevents the overlap of the percentage
					offset: [-16, -32, -48]
				},
				//set the content of the tooltip
				tooltip: {
					backgroundColor: '#ff',
					titleFont: { size: 18 },
					bodyFont: { size: 18 },
					enabled: true,
					callbacks: {
						label: function (/** @type {{ parsed: any; label: any; }} */ context) {
							const x = context.parsed;
							if (x !== null) {
								return `${context.label}: ${x} (${((x * 100) / d.count).toFixed(2)}%)`;
							}
						}
					}
				}
			}
		}
	});
	// @ts-ignore
	pieDiv?.appendChild(pieCanvas);
}

/**
 * @param {{ count?: number; countRows: any; countColumns: any; countData?: number; countMv?: number; countNull?: number; missingValues: any; affectedVariablen: any; allVariablen: any; duplicates?: any[]; }} d
 * @param {HTMLElement | null} barDiv
 */
export function completeness_bar(d, barDiv) {
	const barCanvas = document.createElement('canvas');
const w = 1000;
const h = Math.max(450, d.affectedVariablen.length * 22);
barCanvas.width = w;
barCanvas.height = h;
barCanvas.style.width = w + 'px';
barCanvas.style.height = h + 'px';
	//create needed data for the bar
	const barData = {
		labels: [],
		datasets: []
	};
	//definde background colors of the first 5 missing values type
	const bgcs = [
		'rgba(255, 159, 64, 0.2)',
		'rgba(54, 162, 235, 0.2)',
		'rgba(153, 102, 255, 0.2)',
		'rgba(75, 192, 192, 0.2)',
		'rgba(201, 203, 207, 0.2)'
	];
	//definde background colors on hover of the first 5 missing values type
	const bcs = [
		'rgb(255, 159, 64)',
		'rgb(54, 162, 235)',
		'rgb(153, 102, 255)',
		'rgb(75, 192, 192)',
		'rgb(201, 203, 207)'
	];

	//create on dataset for each type of missing values and put it in the list barData.datasets
	d.missingValues.forEach((/** @type {any} */ mv, /** @type {number} */ i) => {
		//if there is more then 5 type of missing values, create random color for each new type
		if (i > 4) {
			const color = '#' + (((1 << 24) * Math.random()) | 0).toString(16);
			bcs.push(color);
			bgcs.push(color + '33');
		}
		const dataset = {
			label: mv,
			data: [],
			backgroundColor: bgcs[i],
			borderColor: bcs[i]
		};
		// @ts-ignore
		barData.datasets.push(dataset);
	});

	//create dataset for empty cells (null) and put it in the list bar.Data.datasets
	const nullsDataset = {
		label: 'NULL',
		data: [],
		backgroundColor: 'rgba(255, 99, 132, 0.2)',
		borderColor: 'rgb(255, 99, 132)'
	};
	// @ts-ignore
	barData.datasets.push(nullsDataset);

	//set the names of each dataset, this names are variables names
	d.affectedVariablen.forEach((/** @type {{ [x: string]: any; VariableName: any; }} */ v) => {
		// @ts-ignore
		barData.labels.push(v.variableName);
		barData.datasets.forEach((d) => {
			// @ts-ignore
			if (v[d.label]) {
				// @ts-ignore
				d.data.push(v[d.label]);
				return;
			}
			// @ts-ignore
			d.data.push(null);
		});
	});

	// @ts-ignore
	if (barDiv) {
		barDiv.innerHTML = '';
	}
	//get html element of the table that used to show affected variables
	const div = document.getElementById('affectedVar');
	// @ts-ignore
	if (div) {
		div.innerHTML = '';
	}
	//if there is no affacted variable, then there is no need to create this visualization (the bar)
	if (d.affectedVariablen.length > 0) {
		// if there is a lot of affacted variables, then set the height of the bar biger to show it corretly
		if (d.affectedVariablen.length > 10) {
			barCanvas.height = d.affectedVariablen.length * 16;
		}

		//create table to show the names of the affected variables
		const table = document.createElement('table');
		div?.appendChild(table);
		const head = document.createElement('tr');
		table.appendChild(head);
		const th = document.createElement('th');
		th.innerText = `${d.affectedVariablen.length} of ${d.countColumns} variables are affected`;
		head.appendChild(th);
		d.allVariablen.forEach((/** @type {{ VariableName: string; }} */ v) => {
			const tr = document.createElement('tr');
			tr.innerText += v.variableName;
			if (d.affectedVariablen.includes(v)) {
				tr.style.backgroundColor = '#ff000050';
			}
			table.appendChild(tr);
		});

		//create the visualization bar
		const ctx = prepareCanvas(barCanvas, 1000, 500);
		new Chart(ctx, {
			type: 'bar',
			data: barData,
			options: {
				responsive: false,
				skipNull: true,
				borderWidth: 1,
				//set the y-axis as base (bar use usually x-axis)
				indexAxis: 'y',
				plugins: {
					datalabels: {
						//set the percentage in the bar
						formatter: (/** @type {number} */ value) => {
							if (value) {
								const pr = ((value * 100) / d.countRows).toFixed(2);
								// @ts-ignore
								if (pr > 8) {
									return pr + '%';
								}
							}
							//if percentage 0% or 8%< then dont show it
							return null;
						},
						display: 'auto'
					},

					//set content of the tootip
					tooltip: {
						backgroundColor: '#ff',
						enabled: true,
						titleFont: { size: 20 },
  						bodyFont: { size: 20 },
						callbacks: {
							label: function (
								/** @type {{ parsed: { x: any; }; dataset: { label: any; }; }} */ context
							) {
								const x = context.parsed.x;
								if (x !== null) {
									return `${context.dataset.label}: ${x} (${((x * 100) / d.countRows).toFixed(
										2
									)}%)`;
								}
							}
						}
					}
				},

				//costumes the x-axis and the y-axis (name and font of the axis)
				scales: {
					x: {
						title: {
							display: true,
							text: "Row's number",
							font: {
								family: 'Arial, sans-serif',
								size: 20,
								weight: 'bold'
							}
						},
						 ticks: { font: { size: 18 } },
  						max: d.countRows,
  						stacked: true,
						//x-axis represent the number the the rows in the table
						max: d.countRows,
						stacked: true
					},
					y: {
						title: {
							display: true,
							text: 'Variables',
							font: {
								family: 'Arial, sans-serif',
								size: 22,
								weight: 'bold'
							}
						},
						stacked: true,

						//if the name of the variables are very long, don't show the whole name, show just first 20 letter
						ticks: {
							 font: { size: 18 },
							// @ts-ignore
							callback: function (/** @type {any} */ index) {
								// @ts-ignore
								let label = this.getLabelForValue(index);
								if (label.length > 20) {
									label = label.substring(0, 20) + '...';
								}
								return label;
							}
						}
					}
				},
				interaction: {
					mode: 'index',
					axis: 'y',
					intersect: false
				}
			}
		});
		barDiv?.appendChild(barCanvas);
	}
}

/**
 * @param {{ count: number; countRows: number; countColumns: number; countData: number; countMv: number; countNull: number; missingValues: any[]; affectedVariablen: any[]; allVariablen: any[]; duplicates: any[]; }} d
 * @param {{ DataTypeSystemType: string; uniqueValues: any[]; missingValues: { placeholder: any; }[]; VariableName: string; }} v
 * @param {HTMLElement | null} scatterDiv
 */
export function show_unique_value_distribution(d, v, scatterDiv) {
	//this scatter show all values in on variable of the table
	//const scatterDiv = document.getElementById("scatter");
	const scatterCanvas = document.createElement('canvas');
	const wS = 900, hS = 500;
scatterCanvas.width = wS;
scatterCanvas.height = hS;
scatterCanvas.style.width = wS + 'px';
scatterCanvas.style.height = hS + 'px';

	/**
	 * @param {{ labels: any[]; datasets: any[]; }} d
	 */
	let scatterData = {
		labels: [],
		datasets: []
	};
	//	d.allVariablen.forEach((v) => {
	//if the type of the vriable is string, there is no need for the visualizaion
	const types = ['String', 'DateTime'];
	if (types.includes(v.dataTypeSystemType)) {
		return;
	}
	//it is not possible to show all variables in one visualization because the range of values can be very different, therefore only one variable needs to be visualized.
	//this is exaple, you can change it to visualize one variable of the table
	//if (v.VariableName !== "Nitrat") {
	//	return;
	//}
	//create random color for border color and background color for the dataset
	const color = '#' + (((1 << 24) * Math.random()) | 0).toString(16);

	//this is list of the values in the variable as points of x-y-coordinate system
	/**
	 * @type {{ x: any; y: any; r: number; }[]}
	 */
	const points = [];
	/**
	 * @type {any[]}
	 */
	let without_missing = [];
	if (v.missingValues.length > 0) {
		without_missing = v.uniqueValues.filter(function (/** @type {{ var: any; }} */ obj) {
			//console.log(v.missingValues[0].placeholder);
			return obj.var != v.missingValues[0].placeholder;
		});
	} else {
		without_missing = v.uniqueValues;
	}

	const max = Math.max(...without_missing.map((/** @type {{ count: any; }} */ o) => o.count));
	const min = Math.min(...without_missing.map((/** @type {{ count: any; }} */ o) => o.count));
	const without_max = without_missing.filter(function (/** @type {{ count: number; }} */ obj) {
		return obj.count !== max;
	});
	const max_new = Math.max(...without_max.map((/** @type {{ count: any; }} */ o) => o.count));
	console.log(max, min, max_new, max / max_new);
	let text = '';
	let add = '';
	if (max / max_new < 10) {
		let intval = max / 50;
		if (max < 50) {
			intval = 1;
		}
		text = ': max count ' + max;
		without_missing.forEach(
			(/** @type {{ count: number; var: any; }} */ uv, /** @type {any} */ i) => {
				let count = 0;
				if (max < 50) {
					count = uv.count;
				} else {
					count = Math.round(uv.count / intval + 1);
					add = ' (radius: count/' + intval + ' +1)';
				}
				points.push({
					x: i,
					y: uv.var,
					r: count
				});
			}
		);
	} else {
		let intval = max_new / 50;

		text = ': excluding max count ' + max;
		without_max.forEach((/** @type {{ count: number; var: any; }} */ uv, /** @type {any} */ i) => {
			let count = 0;
			if (max_new < 50) {
				count = uv.count;
			} else {
				count = Math.round(uv.count / intval + 1);
				add = ' (radius: count/' + intval + ' +1)';
			}
			points.push({
				x: i,
				y: uv.var,
				r: count
			});
		});
	}
	console.log(points);
	// @ts-ignore
	scatterData.datasets.push({
		label: v.variableName + text + add,
		data: points,
		borderColor: color,
		backgroundColor: color + '33', //make the background color brighter of the border color
		borderWidth: 1
	});
	//	});
	console.log(scatterDiv, 'scatter');
	// @ts-ignore
	if (scatterDiv) {
		scatterDiv.innerHTML = '';
	}
	if (scatterData.datasets.length > 0) {
		const ctx = prepareCanvas(scatterCanvas, 1000, 500);
		new Chart(ctx, {
			type: 'bubble',
			data: scatterData,
			options: {
				responsive: false,
				plugins: {
					datalabels: {
						display: false
					},
					legend: { labels: { font: { size: 18 } } },
    				tooltip: { titleFont: { size: 18 }, bodyFont: { size: 18 } }
				},
				scales: {
    x: {
      title: { display: true, text: 'Index', font: { size: 20, weight: 'bold' } },
      ticks: { font: { size: 18 } }
    },
    y: {
      title: { display: true, text: v.variableName, font: { size: 20, weight: 'bold' } },
      ticks: { font: { size: 18 } }
    }
  }
}
		});
		scatterDiv?.appendChild(scatterCanvas);
	}
}

/**
 * @param {{ duplicates: any[]; allVariablen: any[]; countRows: number; }} d
 */
export function show_dublicates(d) {
	console.log('show_dublicates', d);
	// allow caller to provide the container elements (works with shadow DOM)
	// signature changed to: show_dublicates(d, dupTableElement, duplicatesElement)
	// if the caller didn't pass them, fall back to global document lookup
	// @ts-ignore - support optional args via arguments
	const dupTableElement = arguments[1] ?? document.getElementById('dupTable');
	const duplicatesElement = arguments[2] ?? document.getElementById('duplicates');
	const dupTable = dupTableElement;
	const duplicates = duplicatesElement;
    const dupDiv = document.createElement('div');
    //dupDiv.innerText = 'Duplicates: 0%';
    if (dupTable) {
        dupTable.innerHTML = '';
    }
    if (duplicates) {
        duplicates.innerHTML = '';
    }
    duplicates?.appendChild(dupDiv);
    let dupPerc = 0;
    //create table of all duplicates as html element
    if (d.duplicates) {
        const table = document.createElement('table');
        const tHead = document.createElement('thead');
        const tBody = document.createElement('tbody');
        const tr = document.createElement('tr');
        const headcount = document.createElement('th');
        headcount.innerText = 'Duplicates';
        tr.appendChild(headcount);
        d.allVariablen.forEach((v) => {
            const th = document.createElement('th');
            th.innerText = v.variableName;
            tr.appendChild(th);
        });
        tHead.appendChild(tr);
        table.appendChild(tHead);
        //dupSum is the number of all duplicates, wich can be deleted from the table
        let dupSum = -d.duplicates.length;
        d.duplicates.forEach((dup) => {
            const tr = document.createElement('tr');
            const dupCount = document.createElement('td');
            dupCount.innerText = dup['count'];
            dupSum += dup['count'];
            tr.appendChild(dupCount);
            d.allVariablen.forEach((v) => {
                const td = document.createElement('td');
                //get the values of cells bei id of the variable
                td.innerText = dup['var' + v.variableId];
                tr.appendChild(td);
            });
            tBody.append(tr);
            table.appendChild(tBody);
        });
        dupTable?.appendChild(table);

        //set percentage of duplicates

        dupPerc = parseFloat(((dupSum / d.countRows) * 100).toFixed(20));
    }
	return dupPerc;
}

/**
 * @param {{ DataTypeSystemType: string; uniqueValues: any[]; missingValues: { placeholder: any; }[]; VariableName: string; min: number; max: number; }} v
 * @param {HTMLElement | null} boxplotDiv
 */
export function boxplot(v, boxplotDiv) {
    if (!boxplotDiv) {
        console.warn('boxplotDiv ist null!');
        return;
    }
    const boxplotCanvas = document.createElement('canvas');
    boxplotCanvas.width = 600;
    boxplotCanvas.height = 400;
	boxplotCanvas.style.width = '600px';
	boxplotCanvas.style.height = '400px';

    const boxplotData = {
        labels: [],
        datasets: []
    };

    const types = ['String', 'DateTime'];
    if (types.includes(v.dataTypeSystemType)) {
        return;
    }

    boxplotData.labels.push(v.VariableName || v.variableName || 'Variable');

    // Erzeuge ein Array mit allen Rohwerten (nicht nur unique)
    const data = [];
    let without_missing = [];
    if (v.missingValues.length > 0) {
        without_missing = v.uniqueValues.filter(obj => obj.var != v.missingValues[0].placeholder);
    } else {
        without_missing = v.uniqueValues;
    }
    without_missing.forEach(uv => {
        if (typeof uv.var !== 'number') return;
        for (let i = 0; i < uv.count; i++) {
            data.push(uv.var);
        }
    });

    boxplotData.datasets.push({
        label: v.VariableName || v.variableName || 'Variable',
        data: [data], // Chart.js erwartet ein Array von Arrays für mehrere Boxen!
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 1,
        outlierBackgroundColor: 'red',
        itemBackgroundColor: '#000',
        outlierRadius: 4,
        itemRadius: 2
    });

    if (boxplotData.datasets.length > 0) {
        const ctx = prepareCanvas(boxplotCanvas, 600, 400);
        new Chart(ctx, {
            type: 'boxplot',
            data: boxplotData,
            options: {
                responsive: false,
                plugins: {
                    datalabels: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#ff',
                        enabled: true
                    }
                },
                scales: {
					x: {
    				ticks: { font: { size: 18 } }
				},
                    y: {
                        type: 'logarithmic',
                        //set the min and max of the y-axis
                        min: v.min - 1,
                        max: v.max + 1,
						ticks: { font: { size: 18 } }
                    }
                }
            }
        });
        boxplotDiv.appendChild(boxplotCanvas);
    }
}

/**
 * @param {{ DataTypeSystemType: string; uniqueValues: { var: any; count: any; }[]; VariableName: string; missingValues: { placeholder: any; }[];}} v
 * @param {HTMLElement | null} barDiv
 */
export function bar_cat(v, barDiv) {
	const barCanvas = document.createElement('canvas');
	barCanvas.width = 900; // explizit setzen!
	barCanvas.height = Math.max(400, d.affectedVariablen.length * 20);	
	barCanvas.style.width = '600px';
	barCanvas.style.height = '200px';


	//if the type of the vriable is string, there is no need for the visualizaion
	const types = ['String'];
	if (!types.includes(v.dataTypeSystemType)) {
		return;
	}

	// @ts-ignore
	//boxplotData.labels.push(v.VariableName);
	/**
	 * @type {any[]}
	 */
	const data = [];
	/**
	 * @type {any[]}
	 */
	const label = [];
	let i = 0;

	/**
	 * @type {any[]}
	 */
	let without_missing = [];
	if (v.missingValues.length > 0) {
		without_missing = v.uniqueValues.filter(function (/** @type {{ var: any; }} */ obj) {
			return obj.var != v.missingValues[0].placeholder;
		});
	} else {
		without_missing = v.uniqueValues;
	}

	without_missing.sort(compare);

	without_missing.forEach((/** @type {{ var: any; count: any}} */ uv) => {
		//if the value is not number (null) don't put it in the data for the boxplot, otherwise, it's not gonna working

		if (i < 20) {
			label.push(uv.var);
			data.push(uv.count);
		}
		i = i + 1;
	});
	console.log('bar_cat', data, label);
	// @ts-ignore
	let barData = {
		labels: [],
		datasets: []
	};
	// @ts-ignore
	barData.labels = label;
	// @ts-ignore
	barData.datasets.push({
		label: v.variableName + ' (max 20 with most counts)',
		data: data,
		borderColor: 'rgb(54, 162, 235)', //border color of the dataset
		backgroundColor: 'rgb(54, 162, 235, 02)', //background color of the dataset
		barPercentage: 0.5,
		barThickness: 6,
		maxBarThickness: 8,
		minBarLength: 2
	});

	// @ts-ignore
	if (barDiv) {
		barDiv.innerHTML = '';
	}
	if (barData.datasets.length > 0) {
		const ctx = prepareCanvas(barCanvas, 1000, 500);	
		new Chart(ctx, {
			type: 'bar',
			data: barData,
			options: {
				responsive: false,
				scales: {
					 x: {
      				ticks: { font: { size: 18 } }
    				},
					y: {
						beginAtZero: true,
						ticks: { font: { size: 18 } }
					}
				}
			}
		});
		barDiv?.appendChild(barCanvas);
	}
}

/**
 * @param {{ count: number; }} a
 * @param {{ count: number; }} b
 */
function compare(a, b) {
	if (a.count > b.count) {
		return -1;
	}
	if (a.count < b.count) {
		return 1;
	}
	return 0;
}
