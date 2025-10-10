import Translate from './Translate';
import View from './View';

export default function TranslateAndView() {
  return (
    <div className="px-8 pt-16">
      <h1 className="mb-9 text-4xl font-semibold">Вигляд та переклад</h1>
      <div className="flex w-full items-start gap-6">
        <Translate />
        <View />
      </div>
    </div>
  );
}
