import { useState } from "react";
import { defaultFactory } from "./factoryDefaults";
import { validateFactory } from "./factoryValidation";

export default function FactoryStep({
  initialFactory,
  onPrevious,
  onNext,
}) {

  const [factory, setFactory] = useState(
    initialFactory || defaultFactory
  );

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFactory(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = () => {
    const validation = validateFactory(factory);

    setErrors(validation);

    if (Object.keys(validation).length === 0) {
      onNext(factory);
    }
  };

  return (
    <div className="app-main">

    </div>
  );
}
