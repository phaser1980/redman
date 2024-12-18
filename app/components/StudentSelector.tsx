import { useState, useEffect } from 'react';

interface Student {
  student_id: number;
  student_name: string;
}

interface StudentSelectorProps {
  onStudentChange: (studentId: number | null) => void;
  selectedStudentId: number | null;
}

function StudentSelector({ onStudentChange, selectedStudentId }: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        const sortedStudents = data.sort((a: Student, b: Student) => a.student_id - b.student_id);
        setStudents(sortedStudents);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse">Loading students...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const handleStudentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = event.target.value ? Number(event.target.value) : null;
    onStudentChange(studentId);
  };

  return (
    <div className="mb-6">
      <label htmlFor="student-select" className="block text-sm font-medium text-gray-400 mb-2">
        Select Student
      </label>
      <div className="relative">
        <select
          id="student-select"
          value={selectedStudentId || ''}
          onChange={handleStudentChange}
          className="block w-full bg-gray-900 text-white border border-gray-700 rounded-lg shadow-sm 
            focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
            hover:border-gray-600 transition-colors duration-200 py-2 px-3"
        >
          <option value="">-- Select a student --</option>
          {students.map((student) => (
            <option key={student.student_id} value={student.student_id}
              className="bg-gray-800 text-white">
              Student {student.student_id}
            </option>
          ))}
        </select>
      </div>
      {selectedStudentId && (
        <div className="mt-2 text-sm text-gray-400">
          Active Student ID: {selectedStudentId}
        </div>
      )}
    </div>
  );
}

export default StudentSelector;
