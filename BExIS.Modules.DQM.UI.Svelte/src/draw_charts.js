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

// REMOVE double scaling: let Chart.js handle DPR itself
// Chart.defaults.devicePixelRatio = window.devicePixelRatio || 1;

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
// Globale Font-Einstellungen - ERHÖHEN
Chart.defaults.font.size = 18;  // Von 16 auf 18
Chart.defaults.font.family = 'Arial, sans-serif';
Chart.defaults.font.weight = 'bold';  // NEU: Fett für bessere Lesbarkeit

/**
 * @param {{ count: any; countRows?: number; countColumns?: number; countData: any; countMv: any; countNull: any; missingValues?: any[]; affectedVariablen?: any[]; allVariablen?: any[]; duplicates?: any[]; }} d
 * @param {HTMLElement | null} pieDiv
 */

export function prepareCanvas(canvas, width = 800, height = 500) {
  // Set CSS size (visual) and the drawing buffer to the SAME size.
  // Chart.js will apply its own DPR scaling for crisp text.
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d");
}

// TextZoom-Plugin: vergrößert nur Text im Canvas, ohne Canvas/Chart zu skalieren
const TextZoomPlugin = {
  id: 'textZoom',
  beforeInit(chart, _args, opts) {
    const factor = Math.max(1, (opts && opts.factor) || 1.5);
    const ctx = chart.ctx;
    if (!ctx || ctx.__textZoomApplied) return;
    ctx.__textZoomApplied = true;

    const origFill = ctx.fillText.bind(ctx);
    const origStroke = ctx.strokeText.bind(ctx);

    ctx.fillText = function (text, x, y, maxWidth) {
      this.save();
      this.scale(factor, factor);
      origFill(text, x / factor, y / factor, maxWidth ? maxWidth / factor : undefined);
      this.restore();
    };
    ctx.strokeText = function (text, x, y, maxWidth) {
      this.save();
      this.scale(factor, factor);
      origStroke(text, x / factor, y / factor, maxWidth ? maxWidth / factor : undefined);
      this.restore();
    };
  }
};

Chart.register(TextZoomPlugin);

// HTML-Legende: Box oben, Text darunter
const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, _args, options) {
    const container = options.container;
    if (!container) return;

    // Container leeren
    container.innerHTML = '';

    // Legendendaten wie bisher über generateLabels holen
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach((item) => {
      const entry = document.createElement('div');
      entry.style.display = 'flex';
      entry.style.flexDirection = 'column';
      entry.style.alignItems = 'center';
      entry.style.marginRight = '16px';
      entry.style.fontSize = '18px';
      entry.style.fontWeight = 'bold';
      entry.style.cursor = 'pointer';

      // Farbbox
      const box = document.createElement('div');
      box.style.width = '40px';
      box.style.height = '24px';
      box.style.border = '1px solid #333';
      box.style.background = item.fillStyle;

      // Text UNTER der Box
      const label = document.createElement('div');
      if (Array.isArray(item.text)) {
        // falls du wie aktuell [label, "77%"] zurückgibst
        label.innerHTML = item.text.join('<br>');
      } else {
        label.textContent = item.text;
      }
        label.style.fontSize = '14px';       
        label.style.fontWeight = 'normal';   
        label.style.lineHeight = '1.1';
        label.style.textAlign = 'center';

      entry.appendChild(box);
      entry.appendChild(label);

      // Klick zum Ein-/Ausblenden des Segments
      entry.onclick = () => {
        chart.toggleDataVisibility(item.index);
        chart.update();
      };

      container.appendChild(entry);
    });
  }
};

Chart.register(htmlLegendPlugin);


export function completeness_pie(d, pieDiv) {
    const pieCanvas = document.createElement('canvas');
    pieCanvas.width = 500;               
    pieCanvas.height = 250;
    pieCanvas.style.width = '500px';     
    pieCanvas.style.height = '250px';

     const legendDiv = document.createElement('div');
legendDiv.style.display = 'flex';
legendDiv.style.justifyContent = 'center';   // 🔹 mittig
legendDiv.style.gap = '24px';
legendDiv.style.margin = '10px auto';        // 🔹 zentriert + Abstand
legendDiv.style.alignItems = 'flex-start';

    // zuerst die Legende, dann das Canvas ins übergebene pieDiv packen
    pieDiv?.appendChild(legendDiv);
    pieDiv?.appendChild(pieCanvas);
    /**
	 * @type {string[]}
	 */
	let labels = ['Data'];
	/**
	 * @type {any[]}
	 */
	let data = [d.countData];
	let backgroundColor = ['rgba(218, 240, 236, 1)'];
	let hoverBackgroundColor = ['rgba(218, 240, 236, 1)'];

	if (d.countMv > 0) {
		labels.push('Missing Values');
		data.push(d.countMv);
		backgroundColor.push('rgb(255,229,191, 1)');
		hoverBackgroundColor.push('srgba(255,229,191,1)');
	}
	if (d.countNull > 0) {
		labels.push('NULL');
		data.push(d.countNull);
		backgroundColor.push('rgba(255,191,191, 1)');
		hoverBackgroundColor.push('rgba(255,191,191,1)');
	}
	const ctx = prepareCanvas(pieCanvas, 500, 250);

	new Chart(ctx, {
		type: 'pie',
		data: {
			labels: labels,
			datasets: [
				{
					data: data,
					backgroundColor: backgroundColor,
					hoverBackgroundColor: hoverBackgroundColor
				}
			]
		},
		options: {
			borderWidth: 1,
			responsive: false,
			layout: {
				// padding: {
				// 	top: 20,
				// 	right: 40,
				// 	bottom: 20,
				// 	left: 40
				// }
			},
			plugins: {
				//textZoom: { factor: 1.8 },
				legend: {
                    display: false,    
    labels: {
        font: { size: 26, weight: 'bold' },
        generateLabels: function (chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                    const dataset = data.datasets[0];
                    const total = dataset.data.reduce((acc, val) => acc + val, 0);

                    return data.labels.map((label, i) => {
                        const value = dataset.data[i];
                        const percentage = ((value * 100) / total).toFixed(2);

                        return {
                            // hier kannst du frei definieren, was unter der Box stehen soll
                            text: [label, percentage + '%'],
                            fillStyle: dataset.backgroundColor[i],
                            hidden: false,
                            index: i
                        };
                    });
                }
                return [];
            }
        }
    },
     htmlLegend: {
        container: legendDiv
    },

				datalabels: {
					formatter: (value) => {
						return ((value * 100) / d.count).toFixed(2) + '%';
					},
					color: '#fff',
					font: {
						size: 24,  
						weight: 'bold'
					},
					display: [d.countData > 0, d.countMv > 0, d.countNull > 0],
					align: 'start',
					offset: [-16, -32, -48]
				},
                tooltip: {
                    enabled: false
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
    const w = 500;
    const h = Math.max(250, d.affectedVariablen.length * 22);
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
		'rgb(255, 229, 191)',
		'rgb(229, 243, 240)',
		'rgb(210, 234, 229)',
		'rgb(75, 192, 192)',
		'rgb(201, 203, 207)'
	];

	//create on dataset for each type of missing values and put it in the list barData.datasets
	d.missingValues.forEach((/** @type {any} */ mv, /** @type {number} */ i) => {
		//if there is more then 5 type of missing values, create random color for each new type
		if (i > 4) {
			const color = getRandomColor();  // Verwende die neue Funktion
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
		backgroundColor: 'rgba(255,191,191, 1)',
		borderColor: 'rgba(0, 0, 0, 0.45)'
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
	// get html element of the table that used to show affected variables
	// prefer the passed-in element (works with ShadowRoot), fallback to document lookup
    // let affectedDiv = arguments[2] ?? document.getElementById('affectedVar');
    // fallback to barDiv (so table is at least visible near chart) and debug
    // if (!affectedDiv) {
    //     console.warn('affectedVar not found in document; falling back to barDiv. Pass affectedVarDiv to completeness_bar.');
    //     affectedDiv = barDiv ?? null;
    // }
    // if (affectedDiv) {
    //     affectedDiv.innerHTML = '';
    // }

	// Prefer an explicit third argument (works with ShadowRoot). Do NOT silently fall back to barDiv,
	// otherwise the table may be appended into the chart container.
	// @ts-ignore - support optional args via arguments
	const affectedDiv = arguments[2] ?? null;
    if (!affectedDiv) {
        console.warn('completeness_bar: no affectedVarDiv provided; table will not be rendered. Pass the bound affectedVar element as 3rd arg to place the table beside the chart.');
    } else {
        affectedDiv.innerHTML = '';
    }

    if (d.affectedVariablen.length > 0) {
        if (d.affectedVariablen.length > 10) {
            barCanvas.height = d.affectedVariablen.length * 16;
            barCanvas.style.height = barCanvas.height + 'px';
        }

        // Tabelle rechts befüllen mit BExIS-Farben
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        // Tabellen-Grundstyles
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.backgroundColor = '#ffffff';
        table.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        table.style.fontSize = '1.3rem';
        
        // Header mit BExIS-Farben und STICKY Position
        const headRow = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = `${d.affectedVariablen.length} of ${d.countColumns} variables are affected`;
        th.style.backgroundColor = '#bee1da';
        th.style.color = '#2c3e50';
        th.style.fontWeight = '600';
        th.style.padding = '0.75rem 1rem';
        th.style.borderBottom = '2px solid #95c9be';
        th.style.whiteSpace = 'nowrap';
        th.style.textAlign = 'left';
        th.style.position = 'sticky';  // STICKY HEADER
        th.style.top = '0';            // Bleibt oben beim Scrollen
        th.style.zIndex = '10';        // Über anderen Elementen
        headRow.appendChild(th);
        thead.appendChild(headRow);
        table.appendChild(thead);
        
        // Body mit korrigiertem Farbverhalten
        d.allVariablen.forEach((v, index) => {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = v.variableName;
            td.style.padding = '0.75rem 1rem';
            td.style.borderBottom = '1px solid #dee2e6';
            td.style.color = '#212529';
            td.style.whiteSpace = 'nowrap';
            
            // Prüfe, ob Variable betroffen ist
            const isAffected = d.affectedVariablen.some(av => av.variableId === v.variableId);
            
            // Setze Hintergrundfarben basierend auf Affected-Status
            let originalBg;
            if (isAffected) {
                // Betroffene Variablen: Rot-Töne
                tr.style.backgroundColor = '#ffbfbf';
                tr.style.borderLeft = '3px solid #dc3545';
                originalBg = '#ffbfbf';
            } else if (index % 2 === 1) {
                // Nicht betroffene, ungerade Zeilen: Helles Grau
                tr.style.backgroundColor = '#f8fafa';
                originalBg = '#f8fafa';
            } else {
                // Nicht betroffene, gerade Zeilen: Weiß
                tr.style.backgroundColor = '#ffffff';
                originalBg = '#ffffff';
            }
            
            // Hover-Effekt: Unterschiedliche Farben für affected/nicht-affected
            tr.addEventListener('mouseenter', function() {
                if (isAffected) {
                    this.style.backgroundColor = '#ff9999';  // Dunkleres Rot beim Hover
                } else {
                    this.style.backgroundColor = '#e3f3f1';  // Türkis beim Hover
                }
                this.style.cursor = 'pointer';
            });
            
            tr.addEventListener('mouseleave', function() {
                // Zurück zur Original-Farbe
                this.style.backgroundColor = originalBg;
            });
            
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        affectedDiv?.appendChild(table);

        // WICHTIG: nicht zurück auf 500x250 skalieren → sonst Abschneiden/Blur
        const ctx = prepareCanvas(barCanvas, w, barCanvas.height);
        new Chart(ctx, {
            type: 'bar',
            data: barData,
            options: {
                responsive: false,
                skipNull: true,
                borderWidth: 1,
                indexAxis: 'y',
                layout: {
                    padding: {
                        top: 20,
                        right: 50,
                        bottom: 30,
                        left: 50
                    }
                },
                plugins: {
                    //textZoom: { factor: 1.8 }, // Schrift intern größer zeichnen
                    legend: {
                        labels: {
                            font: { size: 30, weight: 'bold' },
                        }
                    },
                    datalabels: {
                        formatter: (value) => {
                            if (value) {
                                const pr = ((value * 100) / d.countRows).toFixed(2);
                                return pr > 8 ? pr + '%' : null;
                            }
                            return null;
                        },
                        font: { size: 22, weight: 'bold' },  // Von 18 auf 22
                        display: 'auto'
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        enabled: true,
                        titleFont: { size: 26, weight: 'bold' },  // Von 22 auf 26
                        bodyFont: { size: 24, weight: 'bold' },   // Von 22 auf 24
                        callbacks: {
                            label: function (context) {
                                const x = context.parsed.x;
                                if (x !== null) {
                                    return `${context.dataset.label}: ${x} (${((x * 100) / d.countRows).toFixed(2)}%)`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { 
                            display: true, 
                            text: "Row's number", 
                            font: { size: 26, weight: 'bold' }  // Von 20 auf 26
                        },
                        ticks: { font: { size: 22, weight: 'bold' } },  // Von 18 auf 22
                        max: d.countRows,
                        stacked: true
                    },
                    y: {
                        title: { 
                            display: true, 
                            text: 'Variables', 
                            font: { size: 26, weight: 'bold' }  // Von 20 auf 26
                        },
                        stacked: true,
                        ticks: {
                            font: { size: 22, weight: 'bold' },
                            padding: 30,
                            callback: function (index) {
                                let label = this.getLabelForValue(index);
                                if (label.length > 20) label = label.substring(0, 20) + '...';
                                return label;
                            }
                        },
                        padding: { left: 90 }  
                    }
                },
                interaction: { mode: 'index', axis: 'y', intersect: false }
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
	const color = getRandomColor();  // Verwende die neue Funktion statt der alten Berechnung

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
	// console.log(max, min, max_new);
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
	// console.log(points);
	// @ts-ignore
	scatterData.datasets.push({
		label: v.variableName + text + add,
		data: points,
		borderColor: color,
		backgroundColor: color + '33', //make the background color brighter of the border color
		borderWidth: 1
	});
	//	});
	// console.log(scatterDiv, 'scatter');
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
				layout: {
					padding: {
						top: 30,
						right: 30,
						bottom: 30,
						left: 30
					}
				},
				plugins: {
					textZoom: { factor: 1.8 },
					datalabels: {
						display: false
					},
					legend: { 
					 display: true,  // Legende anzeigen
                        labels: { 
                            font: { size: 50, weight: 'bold' },
                            boxWidth: 0,   // Keine Box-Breite
                            boxHeight: 0   // Keine Box-Höhe
                        }
					},
					tooltip: { 
						titleFont: { size: 40, weight: 'bold' },  // Von 22 auf 26
						bodyFont: { size: 40, weight: 'bold' }    // Von 22 auf 24
					}
				},
				scales: {
    x: {
      title: { display: true, text: 'Index', font: { size: 28, weight: 'bold' } },
      ticks: { font: { size: 24, weight: 'bold' } }
    },
    y: {
      title: { display: true, text: v.variableName, font: { size: 28, weight: 'bold' } },
      ticks: { font: { size: 24, weight: 'bold' } }
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
    // console.log('show_dublicates', d);
    
    const dupTableElement = arguments[1] ?? document.getElementById('dupTable');
    const duplicatesElement = arguments[2] ?? document.getElementById('duplicates');
    const dupTable = dupTableElement;
    const duplicates = duplicatesElement;
    
    if (dupTable) {
        dupTable.innerHTML = '';
    }
    if (duplicates) {
        duplicates.innerHTML = '';
    }
    
    let dupPerc = 0;
    
    if (d.duplicates && d.duplicates.length > 0) {
        const table = document.createElement('table');
        const tHead = document.createElement('thead');
        const tBody = document.createElement('tbody');
        
        // Tabellen-Grundstyles
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.backgroundColor = '#ffffff';
        table.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        table.style.fontSize = '1.3rem';
        
        // Header Row mit BExIS-Farben
        const tr = document.createElement('tr');
        const headcount = document.createElement('th');
        headcount.innerText = 'Duplicates';
        headcount.style.backgroundColor = '#bee1da';
        headcount.style.color = '#2c3e50';
        headcount.style.fontWeight = '600';
        headcount.style.padding = '0.75rem 1rem';
        headcount.style.borderBottom = '2px solid #95c9be';
        headcount.style.whiteSpace = 'nowrap';
        headcount.style.textAlign = 'left';
        tr.appendChild(headcount);
        
        d.allVariablen.forEach((v) => {
            const th = document.createElement('th');
            th.innerText = v.variableName;
            th.style.backgroundColor = '#bee1da';
            th.style.color = '#2c3e50';
            th.style.fontWeight = '600';
            th.style.padding = '0.75rem 1rem';
            th.style.borderBottom = '2px solid #95c9be';
            th.style.whiteSpace = 'nowrap';
            th.style.textAlign = 'left';
            tr.appendChild(th);
        });
        
        tHead.appendChild(tr);
        table.appendChild(tHead);
        
        // Body Rows mit Zebra-Streifen und Hover
        let dupSum = -d.duplicates.length;
        d.duplicates.forEach((dup, index) => {
            const tr = document.createElement('tr');
            
            // Zebra-Streifen für gerade Zeilen
            if (index % 2 === 1) {
                tr.style.backgroundColor = '#f8fafa';
            } else {
                tr.style.backgroundColor = '#ffffff';
            }
            
            const dupCount = document.createElement('td');
            dupCount.innerText = dup['count'];
            dupCount.style.fontWeight = '600';
            dupCount.style.padding = '0.75rem 1rem';
            dupCount.style.borderBottom = '1px solid #dee2e6';
            dupCount.style.color = '#212529';
            dupCount.style.whiteSpace = 'nowrap';
            dupSum += dup['count'];
            tr.appendChild(dupCount);
            
            d.allVariablen.forEach((v) => {
                const td = document.createElement('td');
                td.innerText = dup['var' + v.variableId];
                td.style.padding = '0.75rem 1rem';
                td.style.borderBottom = '1px solid #dee2e6';
                td.style.color = '#212529';
                td.style.whiteSpace = 'nowrap';
                tr.appendChild(td);
            });
            
            // Hover-Effekt
            const originalBg = index % 2 === 1 ? '#f8fafa' : '#ffffff';
            tr.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#e3f3f1';
                this.style.cursor = 'pointer';
            });
            
            tr.addEventListener('mouseleave', function() {
                this.style.backgroundColor = originalBg;
            });
            
            tBody.appendChild(tr);
        });
        
        table.appendChild(tBody);
        dupTable?.appendChild(table);

        dupPerc = parseFloat(((dupSum / d.countRows) * 100).toFixed(20));
    }
    
    return dupPerc;
}

/**
 * @param {{ DataTypeSystemType: string; uniqueValues: any[]; missingValues: { placeholder: any; }[]; VariableName: string; }} v
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
                layout: {
                    padding: {
                        top: 20,
                        right: 30,
                        bottom: 20,
                        left: 20
                    }
                },
                plugins: {
                    textZoom: { factor: 1.8 },
                    legend: {
                        labels: { font: { size: 26, weight: 'bold' } }
                    },
                    datalabels: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        titleFont: { size: 26, weight: 'bold' },  // Von 22 auf 26
                        bodyFont: { size: 24, weight: 'bold' },   // Von 22 auf 24
                        enabled: true
                    }
                },
                scales: {
					x: {
    				ticks: { font: { size: 18 } }
				},
                    y: {
                        title: {
                            display: true,
                            text: 'Value',
                            font: { size: 26, weight: 'bold' }  // NEU
                        },
                        type: 'logarithmic',
                        //set the min and max of the y-axis
                        min: v.min - 1,
                        max: v.max + 1,
						ticks: { font: { size: 22, weight: 'bold' } }  // Von 18 auf 22
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
    // Height based on top 20 categories at most
    const categories = Math.min(20, (v.uniqueValues?.length || 0));
    const w = 1400;
    const h = Math.max(600, 40 * categories + 200);
    barCanvas.width = w;
    barCanvas.height = h;
    barCanvas.style.width = w + 'px';
    barCanvas.style.height = h + 'px';


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
	// console.log('bar_cat', data, label);
	// @ts-ignore
	let barData = {
		labels: [],
		datasets: []
	};
	// @ts-ignore
	barData.labels = label;
	// @ts-ignore
	barData.datasets.push({
		label: v.variableName + ' (top 20 values)',
		data: data,
		borderColor: 'rgb(54, 162, 235)', //border color of the dataset
		backgroundColor: 'rgba(190, 225, 218, 1)', //background color of the dataset
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
		const ctx = prepareCanvas(barCanvas, w, h);
		new Chart(ctx, {
			type: 'bar',
			data: barData,
			options: {
				responsive: false,
				layout: {
					padding: {
						top: 30,
						right: 30,
						bottom: 30,
						left: 30
					}
				},
                plugins: {
                    textZoom: { factor: 1.8 }, // Schrift intern größer zeichnen
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 30, weight: 'bold' },
                            boxWidth: 0,  
                            boxHeight: 0   
                        }
                    },
                    datalabels: {
                        display: false
                    },
                    tooltip: {
                        titleFont: { size: 26, weight: 'bold' },
                        bodyFont: { size: 24, weight: 'bold' }
                    }
                },
				scales: {
                    x: { title: {
                        display: true,
                        text: 'Categories',
                        font: { size: 40, weight: 'bold' }  // Von 20 auf 26
                    },
                    ticks: { font: { size: 40, weight: 'bold' } } },
                    y: { 
                        title: {
                            display: true,
                            text: 'Count',
                            font: { size: 40, weight: 'bold' }  // Von 20 auf 26
                        },
                        beginAtZero: true, 
                        ticks: { font: { size: 40, weight: 'bold' } } }
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


/**
 * @returns {string} Hex-Farbcode
 */
function getRandomColor() {
    const colorPalette = [
        '#7dc9bd', 
        '#ffb64d', 
        '#81cb7b'
    ];
    
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    return colorPalette[randomIndex];
}
