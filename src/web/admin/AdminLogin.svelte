<script lang="ts">
  import { AdminAuth } from "@/model/AdminAuth";
  import { Button, Input, Heading, P } from "flowbite-svelte";

  let {}: {} = $props();
  let token = $state("");

  $effect(() => {
    if (AdminAuth.isAuthenticated()) {
      location.hash = "#/admin";
    }
  });

  function handleLogin(e: Event) {
    e.preventDefault();
    if (token.trim()) {
      AdminAuth.setToken(token.trim());
      location.hash = "#/admin";
    }
  }
</script>

<div class="flex items-center justify-center min-h-[60vh]">
  <div class="w-full max-w-md p-6 bg-white rounded-lg shadow dark:bg-gray-800">
    <Heading tag="h1" class="text-2xl font-bold mb-6 text-center"
      >管理员登录</Heading
    >
    <form onsubmit={handleLogin}>
      <div class="mb-4">
        <label
          for="token"
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          访问令牌
        </label>
        <Input
          id="token"
          type="password"
          bind:value={token}
          placeholder="请输入管理员令牌"
          required
        />
      </div>
      <Button type="submit" class="w-full">登录</Button>
    </form>
    <P class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
      请输入管理员令牌
    </P>
  </div>
</div>
