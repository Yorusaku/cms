<template>
  <div class="no-select">
    <img src="@/assets/img/layout/set-type-component.png" alt="no select" />
    <p>请选择要编辑的组件</p>
  </div>
</template>

<style scoped>
.no-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #969799;
}

.no-select img {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.no-select p {
  margin: 0;
  font-size: 14px;
}
</style>
