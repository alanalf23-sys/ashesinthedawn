import NewProjectModal from './modals/NewProjectModal';
import OpenProjectModal from './modals/OpenProjectModal';
import SaveAsModal from './modals/SaveAsModal';
import ExportModal from './modals/ExportModal';
import PreferencesModal from './modals/PreferencesModal';
import AudioSettingsModal from './modals/AudioSettingsModal';
import MidiSettingsModal from './modals/MidiSettingsModal';
import ShortcutsModal from './modals/ShortcutsModal';
import AboutModal from './modals/AboutModal';
import MixerOptionsModal from './modals/MixerOptionsModal';
import ProjectImportExportModal from './ProjectImportExportModal';

export default function ModalsContainer() {
  return (
    <>
      <NewProjectModal />
      <OpenProjectModal />
      <SaveAsModal />
      <ExportModal />
      <ProjectImportExportModal />
      <PreferencesModal />
      <AudioSettingsModal />
      <MidiSettingsModal />
      <ShortcutsModal />
      <AboutModal />
      <MixerOptionsModal />
    </>
  );
}
