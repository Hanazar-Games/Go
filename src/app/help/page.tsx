import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/portal/PortalPages.module.css";
export const metadata: Metadata = { title: "帮助" };
export default function HelpPage() {
  return (
    <main className={styles.infoPage}>
      <header>围达网帮助中心</header>
      <section>
        <h2>怎样开始一盘棋？</h2>
        <p>
          进入<Link href="/hall">对弈大厅</Link>，选择等待中的房间加入；也可以创建房间或使用
          <Link href="/match">快速匹配</Link>。
        </p>
      </section>
      <section>
        <h2>对局操作</h2>
        <ul>
          <li>轮到自己时，鼠标移到空交叉点会出现半透明棋子预览；也可用方向键和回车落子。</li>
          <li>访客在演示对局中执白；白方落子后，黑方会给出不代表真实棋力的本地演示应手。</li>
          <li>棋盘会校验气、提子、禁入点和简单劫；非法落子不会进入棋谱，并会显示具体原因。</li>
          <li>“停一手”会记录 Pass；连续两次停着后进入盘面试算；“请求悔棋”会回退最近一轮演示着手。</li>
          <li>“认输”需要再次确认，并立即按认输结果结束本局。</li>
          <li>公开棋局允许棋友观战，观战者不能落子。</li>
          <li>数目结果仅为浏览器本地试算；日式规则及存在死子争议的局面仍需双方标记、确认后才是正式结果。</li>
        </ul>
      </section>
      <section>
        <h2>棋力和排行榜</h2>
        <p>
          页面使用模拟 Rating 展示棋力，段位是 Rating
          的显示映射。账号和权威对局服务接入后，有效对局才会自动更新分数。
        </p>
      </section>
      <section>
        <h2>本地规则说明</h2>
        <ul>
          <li>黑先白后，双方依次把棋子落在空交叉点；同色相连的棋子共同拥有相邻空点作为“气”。</li>
          <li>一块棋的最后一口气被占据后会整块提走；落子后本方无气且不能先提走对方棋子，属于禁入点。</li>
          <li>简单劫规则禁止立即落子还原上一盘面，必须先在别处行棋后才能继续劫争。</li>
          <li>双方连续停一手后停止行棋：中国规则按子与围空试算，日本规则按围空与提子试算。</li>
          <li>白方获得页面标明的贴目。终局死子存在争议时，必须由双方确认，当前客户端只显示临时试算。</li>
        </ul>
      </section>
      <section>
        <h2>快捷键提示</h2>
        <p>
          顶部“开始(O)、操作(S)、对战(B)、设置(S)、帮助(H)”沿用早期客户端菜单命名，当前可直接点击进入相应页面。
        </p>
      </section>
    </main>
  );
}
