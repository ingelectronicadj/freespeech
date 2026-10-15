<template>
	<div class="edit-header-container">
		<v-card
			theme="light"
			class="px-5 py-3 edit-banner-card"
		>
			<div class="d-flex align-center justify-space-between flex-wrap" style="gap: 12px;">
				<div>
					<h2 class="edit-banner-title">
						<v-icon class="mr-1" color="success" aria-hidden="true">edit_note</v-icon>
						{{ $t('editMode.title') }}
					</h2>
					<p class="edit-banner-desc mb-0">
						{{ $t('editMode.instructions') }}
					</p>
				</div>
				<v-btn
					id="exitEditModeButton"
					color="success"
					size="large"
					class="text-none font-weight-bold px-5"
					@click="exitEditMode"
				>
					<v-icon
						class="mr-2"
						aria-hidden="true"
					>
						save
					</v-icon>
					{{ $t('editMode.buttonSave') }}
				</v-btn>
			</div>
		</v-card>
	</div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
	name: 'EditModeHeader',
	methods: {
		...mapActions('tilePad', ['setEditMode']),
		exitEditMode () {
			this.setEditMode(false);
		}
	}
};
</script>
<style scoped>
.edit-header-container {
	position: -webkit-sticky;
	position: sticky;
	top: 56px;
	z-index: 100;
	padding: 10px 16px 4px;
	background-color: #f1f5f9;
}
.edit-banner-card {
	max-width: 1380px;
	margin: 0 auto;
	background: #ecfdf5 !important;
	border: 2px solid #10b981 !important;
	border-radius: 14px !important;
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08) !important;
}
.edit-banner-title {
	font-size: 1.15rem;
	font-weight: 800;
	color: #065f46;
	margin: 0 0 4px;
	display: flex;
	align-items: center;
}
.edit-banner-desc {
	font-size: 0.92rem;
	color: #1e293b;
}
</style>
