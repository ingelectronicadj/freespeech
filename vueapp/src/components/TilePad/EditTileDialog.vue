<template>
	<v-dialog
		:model-value="editDialogVisibility"
		persistent
		max-width="600px"
	>
		<v-card>
			<v-card-title>
				<span class="headline">
					<v-icon aria-hidden="true">{{ currentTileBeingEdited.newTile ? 'add' : 'edit' }}</v-icon>
					{{ currentTileBeingEdited.newTile ? $t('editMode.tile.addNew') : $t('editMode.tile.title') }}
				</span>
			</v-card-title>
			<v-card-text>
				<v-container>
					<v-form
						id="editTileForm"
						ref="form"
						v-model="valid"
					>
						<v-row>
							<v-col cols="12">
								<v-text-field
									:model-value="currentTileBeingEdited.name"
									:label="$t('editMode.tile.name')"
									:rules="[rules.required]"
									@update:model-value="update('name', $event)"
								/>
								<v-text-field
									:model-value="currentTileBeingEdited.image"
									:label="$t('editMode.tile.imageUrl')"
									@update:model-value="update('image', $event)"
								/>
								<v-img
									max-height="32"
									max-width="32"
									aspect-ratio="1"
									alt=""
									:src="currentTileBeingEdited.image"
								/>
								<v-text-field
									class="pt-5"
									:model-value="currentTileBeingEdited.text"
									:label="$t('editMode.tile.textToSpeak')"
									:rules="[rules.required]"
									@update:model-value="update('text', $event)"
								/>
								<p class="text-left">
									{{ $t('editMode.tile.accentColor') }}
								</p>
								<v-select
									:model-value="currentTileBeingEdited.accent"
									:items="tileColors"
									:label="$t('editMode.tile.accentColor')"
									@update:model-value="update('accent', $event)"
								/>

								<p class="text-left">
									{{ $t('editMode.tile.navigation') }}
								</p>

								<v-text-field
									:model-value="currentTileBeingEdited.navigation"
									:label="$t('editMode.tile.navigationLabel')"
									@update:model-value="update('navigation', $event)"
								/>
							</v-col>
						</v-row>
					</v-form>
				</v-container>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="blue darken-1"
					variant="text"
					@click="saveCurrentEdit"
				>
					{{ $t('editMode.tile.buttonSave') }}
				</v-btn>

				<v-btn
					color="blue darken-1"
					variant="text"
					@click="toggleEditDialogVisibility"
				>
					{{ $t('editMode.tile.buttonClose') }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
	name: 'EditTileDialog',
	data () {
		return {
			tileColors: ['blush', 'peach', 'pear', 'mint', 'violet', 'white'],
			currentColor: 'peach',
			valid: false,
			color: '',
			newTileObject: {},
			rules: {
				required: value => !!value || 'This field is required.'
			}
		};
	},
	computed: {
		...mapGetters('tilePad', [
			'editDialogVisibility',
			'currentTileBeingEdited',
			'customTilePadData'
		]),
		areRequiredFieldsFilled () {
			return !!this.newTileObject.name && !!this.newTileObject.text;
		},
		navigations () {
			return Object.keys(this.customTilePadData);
		}
	},
	methods: {
		...mapActions('tilePad', [
			'toggleEditDialogVisibility',
			'saveEditsToTileBeingEdited',
			'createNewTile',
			'saveTileEdit'
		]),
		validate () {
			if (this.$refs.form && this.$refs.form.validate) {
				this.$refs.form.validate();
			}
		},
		resetValidation () {
			if (this.$refs.form && this.$refs.form.resetValidation) {
				this.$refs.form.resetValidation();
			}
		},
		saveCurrentEdit () {
			if (this.currentTileBeingEdited.newTile) {
				this.validate();

				if (this.valid || this.areRequiredFieldsFilled) {
					this.resetValidation();
					delete this.currentTileBeingEdited.newTile;
					this.createNewTile({ ...this.newTileObject });
					this.newTileObject = {};
					this.toggleEditDialogVisibility();
				}
				return;
			} else {
				this.saveTileEdit();
				this.toggleEditDialogVisibility();
			}
		},
		update (key, value) {
			if (!this.currentTileBeingEdited.newTile) {
				this.saveEditsToTileBeingEdited({
					key,
					value
				});
			} else {
				this.newTileObject[key] = value;
			}
		}
	},
};
</script>
