<template>
    <div ref="wrapper">
        <button
            ref="trigger"
            type="button"
            class="popup-group-trigger"
            :class="{ 'popup-group-trigger--open': isOpen }"
            @click="togglePopup"
            :title="config.display || 'Options'"
        >⚙</button>

        <Teleport to="body">
            <div
                v-if="isOpen"
                ref="popup"
                class="popup-group-popup"
                :style="popupStyle"
            >
                <div class="popup-group-header">
                    <span class="popup-group-title">{{ config.display }}</span>
                    <button type="button" class="popup-group-close" @click="closePopup">✕</button>
                </div>
                <div class="popup-group-body">
                    <FieldsProvider
                        :fields="config.fields || []"
                        :as-config="false"
                        :read-only="isReadOnly"
                        :field-path-prefix="nestedFieldPathPrefix"
                        :meta-path-prefix="nestedMetaPathPrefix"
                    >
                        <Fields />
                    </FieldsProvider>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script>
import { Fieldtype } from '@statamic/cms';
import { PublishFields as Fields, PublishFieldsProvider as FieldsProvider } from '@statamic/cms/ui';

export default {
    name: 'popup_group-fieldtype',

    components: { Fields, FieldsProvider },

    mixins: [Fieldtype],

    provide() {
        const group = {};
        Object.defineProperties(group, {
            config:          { get: () => this.config },
            isReadOnly:      { get: () => this.isReadOnly },
            handle:          { get: () => this.handle },
            fieldPathPrefix: { get: () => this.fieldPathPrefix || this.handle },
            fullScreenMode:  { get: () => false },
            toggleFullScreen:{ get: () => () => {} },
        });
        return { group };
    },

    data() {
        return {
            isOpen: false,
            popupStyle: {},
        };
    },

    computed: {
        nestedFieldPathPrefix() {
            return this.fieldPathPrefix
                ? `${this.fieldPathPrefix}.${this.handle}`
                : this.handle;
        },
        nestedMetaPathPrefix() {
            return this.metaPathPrefix
                ? `${this.metaPathPrefix}.${this.handle}`
                : this.handle;
        },
    },

    methods: {
        togglePopup() {
            this.isOpen ? this.closePopup() : this.openPopup();
        },

        openPopup() {
            this.isOpen = true;
            this.$nextTick(() => {
                this.computePosition();
                // Re-check after fields have rendered and may have changed height
                setTimeout(() => this.computePosition(), 50);
                this.bindEvents();
            });
        },

        closePopup() {
            this.isOpen = false;
            this.unbindEvents();
        },

        computePosition() {
            const trigger = this.$refs.trigger;
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const popup = this.$refs.popup;
            const popupH = popup ? popup.offsetHeight : 300;
            const popupW = popup ? popup.offsetWidth : 320;

            let top = rect.bottom + 6;
            if (top + popupH > window.innerHeight - 12) {
                top = Math.max(8, rect.top - popupH - 6);
            }

            let left = rect.left;
            if (left + popupW > window.innerWidth - 12) {
                left = Math.max(8, window.innerWidth - popupW - 12);
            }

            this.popupStyle = {
                position: 'fixed',
                zIndex: 99999,
                top:  `${top}px`,
                left: `${left}px`,
            };
        },

        bindEvents() {
            this._onOutsideClick = (e) => {
                if (this.$refs.popup?.contains(e.target)) return;
                if (this.$refs.trigger?.contains(e.target)) return;
                this.closePopup();
            };
            this._onEscape = (e) => {
                if (e.key === 'Escape') this.closePopup();
            };
            document.addEventListener('mousedown', this._onOutsideClick);
            document.addEventListener('keydown',   this._onEscape);
        },

        unbindEvents() {
            if (this._onOutsideClick) document.removeEventListener('mousedown', this._onOutsideClick);
            if (this._onEscape)       document.removeEventListener('keydown',   this._onEscape);
        },
    },

    beforeUnmount() {
        this.unbindEvents();
    },
};
</script>

<style scoped>
.popup-group-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, .12);
    background: rgba(255, 255, 255, .04);
    cursor: pointer;
    color: rgba(255, 255, 255, .45);
    font-size: 14px;
    line-height: 1;
    transition: background .15s, color .15s, border-color .15s;
}

.popup-group-trigger:hover,
.popup-group-trigger--open {
    background: rgba(201, 168, 107, .15);
    color: var(--primary, #c9a86b);
    border-color: rgba(201, 168, 107, .3);
}
</style>

<style>
/* Unscoped — popup is teleported outside this component's DOM scope */
.popup-group-popup {
    background: var(--color-gray-700, #2d2d2d);
    border: 1px solid var(--color-gray-600, #3a3a3a);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .55);
    min-width: 300px;
    max-width: 500px;
    overflow: hidden;
}

.popup-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, .07);
}

.popup-group-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: rgba(255, 255, 255, .45);
}

.popup-group-close {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, .35);
    font-size: 12px;
    line-height: 1;
}

.popup-group-close:hover {
    background: rgba(255, 255, 255, .08);
    color: rgba(255, 255, 255, .7);
}

.popup-group-body {
    padding: 14px;
    max-height: 60vh;
    overflow-y: auto;
}
</style>
