<script lang="ts">
  import { Heading, Li, List, P } from "flowbite-svelte";

  async function loadKatex() {
    await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.js"
    );

    await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/contrib/auto-render.min.js"
    );
  }

  let mounted = $state(false);
  let rootNode = $state<HTMLElement | null>(null);

  loadKatex().then(() => {
    mounted = true;
  });

  $effect(() => {
    console.log("Effect triggered", { mounted, rootNode });
    if (mounted && window.renderMathInElement) {
      renderMathInElement(rootNode, [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ]);
    }
  });
</script>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css"
  integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM"
  crossorigin="anonymous"
/>

<div class="p-4 max-w-3xl mx-auto" bind:this={rootNode}>
  <Heading tag="h1" class="text-2xl mt-4">统计方法</Heading>
  <Heading tag="h2" class="text-xl mt-4">杆时</Heading>
  <p>杆时指从抛竿到咬钩的时间。</p>
  <p>
    为保证统计口径统一，在本悬浮窗中，抛竿时间和咬钩时间均为服务器回包时间。
  </p>
  <p>在统计中，我们会按照不同鱼饵、是否使用撒饵技能对数据进行分类。</p>
  <p>我们会忽略在使用拟饵技能后5.3秒内的杆时数据。</p>
  <Heading tag="h2" class="text-xl mt-4">杆时区间</Heading>
  <p>我们使用平均分布模型来对一条鱼的杆时做建模。</p>
  <p>对于鱼的最大杆时和最小杆时，我们记为“全部区间”。</p>
  <p>然后使用四分位距（IQR）法排除离群点，作为“有效区间”。</p>
  <Heading tag="h2" class="text-xl mt-4">条件统计</Heading>
  <p>
    当一条鱼在钓鱼图鉴中提示有天气或时间条件时，我们会统计抛竿时的对应天气和时间状态。
  </p>
  <Heading tag="h2" class="text-xl mt-4">咬钩概率</Heading>
  <p>当用户提钩后，我们会根据对应渔获情况，统计每种鱼出现的概率。</p>
  <p>
    若用户选择不提钩，我们则会根据杆时和现有鱼的概率信息，使用最大期望法推断鱼的咬钩概率。
  </p>
  <Heading tag="h2" class="text-xl mt-4">脱钩率</Heading>
  <p>当用户提钩后，若鱼脱钩，我们会统计不同杆型的脱钩率。</p>
  <p>统计脱钩率时，会忽略掉因获得力不够导致的脱钩情况。</p>
  <p>我们还会尝试根据杆种和杆时，使用最大期望法推断鱼的脱钩率。</p>
  <p>
    当用户使用耐心/耐心II技能时，我们会根据技能对脱钩率的影响调整脱钩率的计算。
  </p>
  <p>
    脱钩率的置信度代表着此脱钩率的可靠程度。当置信度为1时，表示该脱钩率非常可靠。通常出现在当前鱼的杆型只有这条鱼的情况下。
  </p>
  <Heading tag="h1" class="text-2xl mt-4">系统建模</Heading>
  <p>我们根据已有的样本数据，确定了一条鱼的杆时分布服从平均分布。</p>
  <p>考虑到钓鱼时有如下的特殊行为：</p>
  <List tag="ul">
    <Li
      >能否钓到指定的鱼完全由抛杆时间决定。就算在鱼的窗口时间最后一秒抛杆，也有可能钓到对应的鱼。</Li
    >
    <Li
      >触发鱼识后，若鱼识时间时间结束时播放一声“碎玻璃”的声音，则说明当前杆是目标鱼。</Li
    >
    <Li
      >使用雄心/谦逊技能时，会完全重新选择一条鱼，且会根据使用技能的时间判断是否能钓到对应的鱼。</Li
    >
  </List>
  <p>根据上面的观测，我们可以作出推断出整套系统的行为：</p>
  <List tag="ol">
    <Li
      >抛杆时（或使用雄心/谦逊技能时），首先使用内置的概率表，根据当前技能的状态，随机选择一条鱼。</Li
    >
    <Li>根据这条鱼的杆时区间，随机生成一个杆时，在指定时间发出咬钩信号。</Li>
    <Li>提钩时，根据这条鱼的脱钩率，决定是否脱钩。</Li>
  </List>
  <Heading tag="h2" class="text-xl mt-4">杆时反推概率</Heading>
  <p>
    设当前钓场中有 \(n\) 条鱼 \(\lbrace F_1, F_2, \ldots, F_n \rbrace\)，已知：
  </p>
  <List tag="ul">
    <Li
      >先验概率：\(P(F_i) = p_i\), 且 \( \sum_ &lbrace; i=1 &rbrace; ^n p_i = 1
      \)</Li
    >
    <Li
      >指定鱼 \(F_i\) 对应的咬钩区间：\( [a_i, b_i] \)，区间长度为 \(L_i = b_i -
      a_i &gt; 0\)</Li
    >
    <Li
      >给定鱼 \(F_i\) 时，时间点 \( T \) 在区间 \( [a_i, b_i] \) 内均匀分布。</Li
    >
  </List>
  <p>根据贝叶斯定理，当杆时为 \(t\) 时，对应类别 \(F_i\) 的概率为：</p>
  <p>
    $$ P(F_i \mid t) = \begin&lbrace;cases&rbrace; \displaystyle \frac&lbrace;
    p_i / L_i&rbrace;&lbrace; \sum_ &lbrace; j \in S_t &rbrace; p_j / L_j
    &rbrace;, & \text&lbrace; 若 &rbrace; t \in [a_i, b_i] \\ 0, & \text&lbrace;
    若 &rbrace; t \notin [a_i, b_i] \end&lbrace;cases&rbrace; $$
  </p>
  <p>
    其中 \(S_t = \lbrace j \mid t \in [a_j, b_j] \rbrace\) 是所有包含时间点
    \(t\) 的鱼的集合。
  </p>
  <p>
    如果使用了谦逊/雄心技能，且在技能冷却窗口期过后的时间立刻咬钩（记为
    \(t_1\)），则实际杆时可能为 \( T \in [ 0, t_1 ] \)。
  </p>
  <p>此时对应类别 \(F_i\) 的概率为：</p>
  <p>
    $$ P(C_i \mid T) = \frac&lbrace;p_i \cdot
    \dfrac&lbrace;D_i&rbrace;&lbrace;L_i&rbrace;&rbrace;&lbrace;\sum_&lbrace;j=1&rbrace;^n
    p_j \cdot \dfrac&lbrace;D_j&rbrace;&lbrace;L_j&rbrace;&rbrace; $$
  </p>
  <p>
    其中，\(D_i = \max(0, \min(t_1, b_i) - a_i)\) 是鱼 \(F_i\)
    的咬钩区间与咬钩时间的交集长度。
  </p>
</div>

<style scoped>
  p {
    line-height: 1.75;
  }
</style>
