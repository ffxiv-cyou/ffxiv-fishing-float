<script lang="ts">
  let {
    class: _class = "",
  }: {
    class?: string;
  } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  color="currentColor"
  class="shrink-0 {_class}"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    d="m8 10 4 4 4-4"
    stroke-width="2"
  ></path>
</svg>
