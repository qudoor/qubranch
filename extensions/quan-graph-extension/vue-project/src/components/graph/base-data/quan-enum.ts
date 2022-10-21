/*
 * @Date: 2022-04-08 11:46:41
 * @Description:量子的枚举
 */
import { Quan } from '@/class/quan'
export default {
	H: new Quan({
		quanName: 'H',
		quanValue() {
			return `<g ><!----> <!----> <!----> <g transform="translate(9,4)"><rect width="32" height="32" style="fill:#fa4d56;"></rect> <!----> <text dominant-baseline="alphabetical" x="16" y="22" style="font-size: 18px; font-style: normal; fill:  #000000; font-weight: normal;"><tspan text-anchor="middle">${this.quanName}</tspan></text> <!----> <!----></g> <!----></g>`
		}
	}),
	N: new Quan({
		quanName: 'N',
		quanValue() {
			return `<g ><!----> <!----> <!----> <g transform="translate(9,4)"><rect width="32" height="32" style="fill:  #fa4d56;"></rect> <!----> <text dominant-baseline="alphabetical" x="16" y="22" style="font-size: 18px; font-style: normal; fill:  #000000; font-weight: normal;"><tspan text-anchor="middle">${this.quanName}</tspan></text> <!----> <!----></g> <!----></g>`
		}
	})
}
