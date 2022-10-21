/*
 * @Date: 2022-05-13 08:30:57
 * @Description:基础数据
 */
export const hardwareTableColumn = {
	colonyBox: [
		{
			title: 'IP',
			dataIndex: ['IP', 'ip']
		},
		{
			title: 'OS',
			children: [
				{
					title: '名称',
					dataIndex: ['OS', '名称']
				}
			]
		},
		{
			title: 'CPU',
			children: [
				{
					title: '规格型号',
					dataIndex: ['CPU', '型号名称']
				},
				{
					title: '主频',
					dataIndex: ['CPU', '主频']
				},
				{
					title: '每个座的核数',
					dataIndex: ['CPU', '每个座的核数']
				},
				{
					title: '每个核的线程数',
					dataIndex: ['CPU', '每个核的线程数']
				},
				{
					title: 'L1Cache',
					dataIndex: ['CPU', 'L1i 缓存']
				},
				{
					title: 'L2Cache',
					dataIndex: ['CPU', 'L2 缓存']
				},
				{
					title: '指令集',
					dataIndex: ['CPU', '指令集']
				}
			]
		},
		{
			title: 'GPU',
			dataIndex: 'name',
			children: [
				{
					title: '型号',
					dataIndex: ['GPU', '型号']
				},
				{
					title: '算力',
					dataIndex: ['GPU', '算力']
				},
				{
					title: '主频',
					dataIndex: ['GPU', '主频']
				}
			]
		},
		{
			title: '内存',
			dataIndex: '内存',
			children: [
				{
					title: '类型',
					dataIndex: ['内存', 'Type']
				},
				{
					title: '通道数',
					dataIndex: ['内存', '通道数']
				},
				{
					title: '大小',
					dataIndex: ['内存', 'MemTotal']
				},
				{
					title: '频率',
					dataIndex: ['内存', 'Speed']
				}
			]
		},
		{
			title: '网络I/O',
			dataIndex: '网络I/O',
			children: [
				{
					title: '上行',
					dataIndex: ['网络I/O', '上行']
				},
				{
					title: '下行',
					dataIndex: ['网络I/O', '下行']
				}
			]
		},
		{
			title: '磁盘I/O',
			dataIndex: '磁盘I/O',
			children: [
				{
					title: '读',
					dataIndex: ['磁盘I/O', '读']
				},
				{
					title: '写',
					dataIndex: ['磁盘I/O', '写']
				}
			]
		},
		{
			title: '操作',
			key: 'actions',
			fixed: 'right'
		}
	],
	single: [
		{
			title: 'IP',
			dataIndex: ['ip', 'ip']
		},
		{
			title: 'OS',
			dataIndex: 'OS',
			children: [
				{
					title: '名称',
					dataIndex: ['OS', '名称']
				},
				{
					title: '位',
					dataIndex: ['OS', '位']
				}
			]
		},
		{
			title: 'CPU',
			dataIndex: 'CPU',
			children: [
				{
					title: '规格型号',
					dataIndex: ['CPU', 'CPU型号']
				},
				{
					title: '主频',
					dataIndex: ['CPU', '主频']
				},
				{
					title: '核心数',
					dataIndex: ['CPU', '核心数']
				},
				{
					title: '线程数',
					dataIndex: ['CPU', '线程数']
				},
				{
					title: 'L1Cache',
					dataIndex: ['CPU', 'L1 Cache']
				},
				{
					title: 'L2Cache',
					dataIndex: ['CPU', 'L2 Cache']
				},
				{
					title: '指令集',
					dataIndex: ['CPU', '指令集']
				}
			]
		},
		// {
		//   title: 'GPU',
		//   dataIndex: 'name',
		//   children: [
		//     {
		//       title: '型号',
		//       dataIndex: 'name'
		//     },
		//     {
		//       title: '算力',
		//       dataIndex: 'name'
		//     },
		//     {
		//       title: '主频',
		//       dataIndex: 'name'
		//     },
		//     {
		//       title: 'SM数',
		//       dataIndex: 'name'
		//     },
		//     {
		//       title: '共享内存',
		//       dataIndex: 'name'
		//     },
		//     {
		//       title: 'L2Cache',
		//       dataIndex: 'name'
		//     }
		//   ]
		// },
		{
			title: '内存',
			dataIndex: '内存',
			children: [
				{
					title: '类型',
					dataIndex: ['内存', '内存类型']
				},
				{
					title: '通道数',
					dataIndex: ['内存', '通道数']
				},
				{
					title: '大小',
					dataIndex: ['内存', '大小']
				},
				{
					title: '频率',
					dataIndex: ['内存', '频率']
				}
			]
		},
		{
			title: '网络I/O',
			dataIndex: '网络I/O',
			children: [
				{
					title: '上行',
					dataIndex: ['网络I/O', '上行']
				},
				{
					title: '下行',
					dataIndex: ['网络I/O', '下行']
				}
			]
		},
		{
			title: '磁盘I/O',
			dataIndex: '磁盘I/O',
			children: [
				{
					title: '读',
					dataIndex: ['磁盘I/O', '读']
				},
				{
					title: '写',
					dataIndex: ['磁盘I/O', '写']
				}
			]
		},
		{
			title: '操作',
			key: 'actions',
			fixed: 'right'
		}
	],
	singleMac: [
		{
			title: 'IP',
			dataIndex: ['ip', 'ip']
		},
		{
			title: 'OS',
			children: [
				{
					title: '名称',
					dataIndex: ['OS', '名称']
				}
			]
		},
		{
			title: 'CPU',
			children: [
				{
					title: '规格型号',
					dataIndex: ['CPU', 'machdep.cpu.brand_string']
				},
				{
					title: '主频',
					dataIndex: ['CPU', 'machdep.cpu.extfeature_bits']
				},
				{
					title: '核数',
					dataIndex: ['CPU', 'machdep.cpu.core_count']
				},
				{
					title: '线程数',
					dataIndex: ['CPU', 'machdep.cpu.thread_count']
				},
				{
					title: 'L1Cache',
					dataIndex: ['CPU', 'L1i 缓存']
				},
				{
					title: 'L2Cache',
					dataIndex: ['CPU', 'machdep.cpu.cache.size']
				},
				{
					title: '指令集',
					dataIndex: ['CPU', 'machdep.cpu.features']
				}
			]
		},

		{
			title: '内存',

			children: [
				{
					title: '类型',
					dataIndex: ['ram', 'Type']
				},
				{
					title: '通道数',
					dataIndex: ['ram', '通道数']
				},
				{
					title: '大小',
					dataIndex: ['ram', 'total']
				},
				{
					title: '频率',
					dataIndex: ['ram', 'Speed']
				}
			]
		},
		// {
		//   title: '网络I/O',
		//   dataIndex: '网络I/O',
		//   children: [
		//     {
		//       title: '上行',
		//       dataIndex: ['网络I/O', '上行']
		//     },
		//     {
		//       title: '下行',
		//       dataIndex: ['网络I/O', '下行']
		//     }
		//   ]
		// },
		// {
		//   title: '磁盘I/O',
		//   dataIndex: '磁盘I/O',
		//   children: [
		//     {
		//       title: '读',
		//       dataIndex: ['磁盘I/O', '读']
		//     },
		//     {
		//       title: '写',
		//       dataIndex: ['磁盘I/O', '写']
		//     }
		//   ]
		// },
		{
			title: '操作',
			key: 'actions',
			fixed: 'right'
		}
	]
}

export const resultListColumn = {
	colonyBox: [
		{
			title: '任务名称',
			dataIndex: 'taskname',
			customCell: (_, index) => {
				return index === 0 ? { rowSpan: _.tasknameLen } : { rowSpan: 0 }
			}
		},
		{
			title: '算法名称',
			dataIndex: 'algorithm',
			customCell: (_, index) => {
				return index % _.algorithmLen === 0 ? { rowSpan: _.algorithmLen } : { rowSpan: 0 }
			}
		},
		{
			title: '量子比特数',
			dataIndex: 'now_qubit',
			customCell: (_, index) => {
				return index % _.now_qubitLen === 0 ? { rowSpan: _.now_qubitLen } : { rowSpan: 0 }
			}
		},
		{
			title: '测试轮次',
			dataIndex: 'now_round'
		},
		{
			title: '运行用时',
			dataIndex: ['time']
		},
		{
			title: '线程数',
			dataIndex: 'cpu_thread'
		},
		{
			title: 'cpu使用率',
			dataIndex: 'cpu_speed'
		},
		{
			title: '内存使用率',
			dataIndex: 'men_speed'
		}
	],
	single: [
		{
			title: '任务名称',
			dataIndex: 'taskname'
		},
		{
			title: '算法名称',
			dataIndex: 'name'
		},
		{
			title: '量子比特数',
			dataIndex: 'number'
		},
		// {
		//   title: '纯/混合态',
		//   dataIndex: 'name'
		// },
		// {
		//   title: '量子门数量',
		//   dataIndex: 'name'
		// },
		// {
		//   title: '量子深度',
		//   dataIndex: 'name'
		// },
		// {
		//   title: '测试轮次',
		//   dataIndex: 'name'
		// },
		// {
		//   title: '编译用时',
		//   dataIndex: 'name'
		// },
		{
			title: '运行用时',
			dataIndex: 'excution_time'
		},
		{
			title: '线程数',
			dataIndex: 'cpu_threads'
		},
		{
			title: 'cpu使用率',
			dataIndex: 'cpu_speed'
		},
		{
			title: '内存使用率',
			dataIndex: 'men_speed'
		}
		// {
		//   title: '网络I/O',
		//   dataIndex: 'name'
		// }
	],
	colonySlurm: [
		{
			title: '任务名称',
			dataIndex: 'taskname',
			customCell: (_, index) => {
				return index === 0 ? { rowSpan: _.tasknameLen } : { rowSpan: 0 }
			}
		},
		{
			title: '算法名称',
			dataIndex: 'algorithm',
			customCell: (_, index) => {
				return index % _.algorithmLen === 0 ? { rowSpan: _.algorithmLen } : { rowSpan: 0 }
			}
		},
		{
			title: '量子比特数',
			dataIndex: 'now_qubit',
			customCell: (_, index) => {
				return index % _.now_qubitLen === 0 ? { rowSpan: _.now_qubitLen } : { rowSpan: 0 }
			}
		},
		{
			title: '测试轮次',
			dataIndex: 'now_round'
		},
		{
			title: '运行用时',
			dataIndex: ['time']
		}
	]
}
