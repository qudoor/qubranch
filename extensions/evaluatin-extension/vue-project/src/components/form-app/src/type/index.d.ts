/*
 * @Date: 2021-12-15 11:18:44
 * @Description: 接口定义
 */
export interface schemasItemINF {
	/**字段名称 */
	field: string
	/**组件类型 */
	component: ComponentType
	/**label名称 */
	label: string | number
	/**form-item的col配置 */
	colProps?: any
	/**组件的配置 */
	componentProps?: any
	/**formItem的配置 */
	formItemProps?: any
	/**自定义formItem的内容插槽 */
	slot?: string
}

export interface userFormAppBody {
	setRules: Function
	setFormData: Function
	getFormRef: Function
}

//默认支持的组件类型
export type ComponentType =
	| 'Input'
	| 'InputGroup'
	| 'InputPassword'
	| 'InputSearch'
	| 'InputTextArea'
	| 'InputNumber'
	| 'InputCountDown'
	| 'Select'
	| 'TreeSelect'
	| 'ApiTreeSelect'
	| 'RadioButtonGroup'
	| 'RadioGroup'
	| 'Checkbox'
	| 'CheckboxGroup'
	| 'AutoComplete'
	| 'Cascader'
	| 'DatePicker'
	| 'MonthPicker'
	| 'RangePicker'
	| 'WeekPicker'
	| 'TimePicker'
	| 'Switch'
	| 'StrengthMeter'
	| 'Upload'
	| 'Render'
	| 'Slider'
	| 'Rate'
	| 'Slot'
