/*
 * @Date: 2022-04-08 11:09:43
 * @Description:代表量子门的类
 */
interface QuanINF {
	positon?: [number, number][]
	formatOptions?: { [key: string]: string }[]
	quanValue: any
	quanCode?: string
	quanName: string
}
export class Quan {
	/**量子门所在的位置 */
	position: [number, number][]
	/**对应内容格式化的配置 */
	formatOptions: { [key: string]: string }[]
	/**对应的内容即svg */
	quanValue: any
	/**对应的量子代码 */
	quanCode: string
	quanName: string
	constructor(value: QuanINF) {
		Object.assign(this, { ...value })
	}
	/**
	 * @description: 获取类的属性
	 * @param {*} key 类的属性名
	 * @return {*} 属性值
	 */
	getValue(key: 'position' | 'formatOptions' | 'quanValue' | 'quanCode' | 'quanName') {
		return this[key]
	}
}
