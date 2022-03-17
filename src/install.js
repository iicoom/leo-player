/**
 * Created by Leo
 * Date: 2022-03-17 15:00
 * Email: asdfpeng@qq.com
 */
import LeoPlayer from "./LeoPlayer";

export default {
	install: (Vue, options) => {
		Vue.component("leo-player", LeoPlayer)
	}
}
